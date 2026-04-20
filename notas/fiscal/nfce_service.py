from datetime import datetime
import tempfile
from zoneinfo import ZoneInfo
from supabase import create_client
from cryptography.fernet import Fernet
import os

from fastapi import APIRouter, Header, HTTPException

from database import conectar
from .nfce_xml import gerar_xml_nfce
from .nfce_assinatura import assinar_xml
from .nfce_envio import enviar_nfce
from .nfce_validacoes import validar_comercio_fiscal, validar_produto_fiscal
from .nfce_xml import gerar_chave_acesso

router = APIRouter()

FISCAL_API_TOKEN = "fiscal_secreto_2026"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FERNET_KEY = os.getenv("FERNET_KEY").encode()
fernet = Fernet(FERNET_KEY)



def validar_token_fiscal(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token fiscal não informado")

    if authorization != f"Bearer {FISCAL_API_TOKEN}":
        raise HTTPException(status_code=403, detail="Token fiscal inválido")


def log(msg):
    print(f"[NFCe][{datetime.now().strftime('%H:%M:%S')}] {msg}")


@router.post("/emitir/{venda_id}")
def emitir_nfce_manual(
    venda_id: int,
    authorization: str = Header(None)
):
    validar_token_fiscal(authorization)

    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    tmp_path = None

    try:
        # ===============================
        # 1. VENDA + COMÉRCIO + FISCAL
        # ===============================
        cursor.execute("""
            SELECT 
                v.*,
                c.*,
                f.*
            FROM vendas_ib v
            INNER JOIN comercios_cadastradas c ON c.id = v.empresa
            INNER JOIN fiscal_dados_comercio f ON f.comercio_id = c.id
            WHERE v.id = %s
        """, (venda_id,))

        dados = cursor.fetchone()
        print("DEBUG ID:", dados.get("id"))
        print("DEBUG EMPRESA:", dados.get("empresa"))
        print("DEBUG COMERCIO_ID:", dados.get("comercio_id"))
        if not dados:
            raise HTTPException(status_code=404, detail="Venda não encontrada")

        comercio = dados
        fiscal = dados

        validar_comercio_fiscal(fiscal)


        # ===============================
        # 2. ITENS
        # ===============================
        cursor.execute("""
            SELECT 
                p.id,
                p.nome,
                p.preco,
                vp.quantidade,
                f.ncm,
                f.cfop,
                f.origem,
                f.cst_csosn
            FROM vendas_produtos vp
            INNER JOIN produtos_servicos p ON p.id = vp.produto_id
            INNER JOIN fiscal_dados_cupons f ON f.produto_id = p.id
            WHERE vp.venda_id = %s
              AND f.comercio_id = %s
        """, (venda_id, comercio["empresa"]))

        itens = cursor.fetchall()
        if not itens:
            raise Exception("Venda sem itens fiscais")

        for item in itens:
            validar_produto_fiscal(item)

        total_nf = sum(i["quantidade"] * i["preco"] for i in itens)

        # ===============================
        # 3. NUMERAÇÃO
        # ===============================
        cursor.execute("""
            SELECT ultimo_numero
            FROM fiscal_numeracao_nfce
            WHERE comercio_id = %s
              AND serie = %s
              AND ambiente = %s
            FOR UPDATE
        """, (
            comercio["empresa"],
            fiscal["serie_nfce"],
            fiscal["ambiente_emissao"]
        ))

        numeracao = cursor.fetchone()
        if not numeracao:
            raise Exception("Numeração NFC-e não configurada")

        numero_nfce = numeracao["ultimo_numero"] + 1

        # ===============================
        # GERAR CHAVE DE ACESSO
        # ===============================

        ano_mes = datetime.now().strftime("%y%m")

        cnpj_limpo = (
            comercio["cnpj"]
            .replace(".", "")
            .replace("/", "")
            .replace("-", "")
        )

        codigo_uf = comercio["codigo_uf"]  # ex: "35" para SP

        chave_acesso, cNF, cDV = gerar_chave_acesso(
            codigo_uf,
            ano_mes,
            cnpj_limpo,
            "65",  # modelo NFC-e
            fiscal["serie_nfce"],
            numero_nfce
        )


        cursor.execute("""
            UPDATE fiscal_numeracao_nfce
            SET ultimo_numero = %s,
                atualizado_em = NOW()
            WHERE comercio_id = %s
              AND serie = %s
              AND ambiente = %s
        """, (
            numero_nfce,
            comercio["empresa"],
            fiscal["serie_nfce"],
            fiscal["ambiente_emissao"]
        ))

        # ===============================
        # 4. XML
        # ===============================
        dados_nfce = {
            "comercio": comercio,
            "fiscal": fiscal,
            "venda": dados,
            "itens": itens,
            "numero_nfce": numero_nfce,
            "chave_acesso": chave_acesso,
            "cNF": cNF,
            "cDV": cDV
        }


        xml_base = gerar_xml_nfce(dados_nfce, None)

        # ===============================
        # BAIXAR CERTIFICADO DO SUPABASE
        # ===============================

        senha_real = fernet.decrypt(
            fiscal["certificado_senha_enc"].encode()
        ).decode()

        arquivo_bytes = supabase.storage.from_("assinaturas").download(
            fiscal["certificado_path"]
        )

        if not arquivo_bytes:
            raise Exception("Falha ao baixar certificado do Supabase")

        tmp_path = os.path.join(
            tempfile.gettempdir(),
            f"cert_{venda_id}.pfx"
        )

        with open(tmp_path, "wb") as f:
            f.write(arquivo_bytes)

        # ===============================
        # ASSINAR
        # ===============================
        xml_assinado = assinar_xml(
            xml_base,
            tmp_path,
            senha_real
        )

        # ===============================
        # ENVIAR
        # ===============================
        retorno = enviar_nfce(
            xml_assinado,
            fiscal["ambiente_emissao"],
            tmp_path,
            senha_real,
            fiscal,
            total_nf
        )

        # ===============================
        # 5. REGISTRO
        # ===============================
        cursor.execute("""
            INSERT INTO nfce_emitidas
            (
                comercio_id,
                venda_id,
                numero_nfce,
                serie,
                chave_acesso,
                qr_code_url,
                protocolo_autorizacao,
                status,
                ambiente,
                criado_em
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            comercio["empresa"],
            venda_id,
            numero_nfce,
            fiscal["serie_nfce"],
            retorno["chave"],
            retorno["qr_code"],
            retorno["protocolo"],
            "autorizada",
            fiscal["ambiente_emissao"],
            datetime.now(ZoneInfo("America/Sao_Paulo"))
        ))

        conn.commit()

        return {
            "ok": True,
            "venda_id": venda_id,
            "numero_nfce": numero_nfce,
            "chave": retorno["chave"]
        }

    except Exception as e:
        conn.rollback()
        log(str(e))
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # 🔥 APAGA CERTIFICADO TEMPORÁRIO
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

        cursor.close()
        conn.close()
