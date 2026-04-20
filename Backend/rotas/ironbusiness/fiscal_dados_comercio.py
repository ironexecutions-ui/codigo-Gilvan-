from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

from supabase import create_client, Client
from cryptography.fernet import Fernet
import uuid
import os

router = APIRouter(prefix="/fiscal/comercio", tags=["Fiscal - Comércio"])
def exigir_admin(cliente):
    funcao = (cliente.get("funcao") or "").strip().lower()

    if funcao not in ["administrador(a)"]:
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito a administradores"
        )


# ===============================
# SUPABASE
# ===============================
SUPABASE_URL = "https://mtljmvivztkgoolnnwxc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGptdml2enRrZ29vbG5ud3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQwMzM0MywiZXhwIjoyMDc4OTc5MzQzfQ.XFJVnYVbK-pxJ7oftduk680YsXltdUB06Yr_buIoJPA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET = "assinaturas"
PASTA = "comercios"

# ===============================
# CRIPTOGRAFIA
# ===============================
# ⚠️ gere UMA chave e guarde em variável de ambiente em produção
FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key())
fernet = Fernet(FERNET_KEY)

# ===============================
# SCHEMA INLINE
# ===============================
class SalvarCampoPayload(BaseModel):
    tabela: str
    campo: str
    valor: str | None = None


# ===============================
# OBTER DADOS DO COMÉRCIO
# ===============================
@router.get("/")
def obter_dados_comercio(cliente=Depends(verificar_token_cliente)):
    exigir_admin(cliente)

    res = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    comercio = executar_select("""
        SELECT *
        FROM comercios_cadastradas
        WHERE id = %s
    """, (comercio_id,))

    fiscal = executar_select("""
        SELECT *
        FROM fiscal_dados_comercio
        WHERE comercio_id = %s
    """, (comercio_id,))

    return {
        "comercio": comercio[0] if comercio else {},
        "fiscal": fiscal[0] if fiscal else {}
    }


# ===============================
# SALVAR CAMPO INLINE
# ===============================
@router.post("/salvar-campo")
def salvar_campo(
    dados: SalvarCampoPayload,
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)

    res = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    if dados.tabela not in ["comercios_cadastradas", "fiscal_dados_comercio"]:
        raise HTTPException(400, "Tabela inválida")

    if dados.tabela == "fiscal_dados_comercio":

        executar_comando("""
            INSERT IGNORE INTO fiscal_dados_comercio (comercio_id)
            VALUES (%s)
        """, (comercio_id,))

        executar_comando(f"""
            UPDATE fiscal_dados_comercio
            SET {dados.campo} = %s,
                atualizado_em = NOW()
            WHERE comercio_id = %s
        """, (dados.valor, comercio_id))

    else:
        executar_comando(f"""
            UPDATE comercios_cadastradas
            SET {dados.campo} = %s
            WHERE id = %s
        """, (dados.valor, comercio_id))

    return {"ok": True}


# ===============================
# UPLOAD CERTIFICADO A1
# ===============================
@router.post("/upload-certificado")
def upload_certificado(
    senha: str = Form(...),
    arquivo: UploadFile = File(...),
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)

    if not arquivo.filename.endswith(".pfx"):
        raise HTTPException(400, "O certificado deve ser .pfx")

    res = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    # garante linha fiscal
    executar_comando("""
        INSERT IGNORE INTO fiscal_dados_comercio (comercio_id)
        VALUES (%s)
    """, (comercio_id,))

    # nome único
    nome_arquivo = f"{uuid.uuid4()}.pfx"
    caminho = f"{PASTA}/{comercio_id}/{nome_arquivo}"

    conteudo = arquivo.file.read()

    # upload supabase
    supabase.storage.from_(BUCKET).upload(
        caminho,
        conteudo,
        {"content-type": "application/x-pkcs12"}
    )

    # criptografa senha
    senha_enc = fernet.encrypt(senha.encode()).decode()

    # salva no banco
    executar_comando("""
        UPDATE fiscal_dados_comercio
        SET certificado_path = %s,
            certificado_senha_enc = %s,
            atualizado_em = NOW()
        WHERE comercio_id = %s
    """, (caminho, senha_enc, comercio_id))

    return {
        "ok": True,
        "arquivo": caminho
    }
