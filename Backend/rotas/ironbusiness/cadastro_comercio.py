from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import conectar
import random
import string
import bcrypt

router = APIRouter(prefix="/cadastro")

# =========================================
# FUNÇÕES AUXILIARES
# =========================================

def executar_select(conn, query, params=()):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    dados = cursor.fetchall()
    cursor.close()
    return dados


def executar_comando(conn, query, params=()):
    cursor = conn.cursor()
    cursor.execute(query, params)
    last_id = cursor.lastrowid
    cursor.close()
    return last_id


def gerar_codigo_unico(conn, tabela, coluna, tamanho=20):
    while True:
        codigo = ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=tamanho)
        )
        existe = executar_select(
            conn,
            f"SELECT {coluna} FROM {tabela} WHERE {coluna} = %s",
            (codigo,)
        )
        if not existe:
            return codigo


# =========================================
# MODELOS
# =========================================

class Loja(BaseModel):
    loja: str
    imagem: str | None = None
    cnpj: str | None = None
    cep: str | None = None
    rua: str | None = None
    bairro: str | None = None
    numero: str | None = None
    cidade: str | None = None
    estado: str | None = None
    email: str | None = None
    celular: str | None = None


class Personalizar(BaseModel):
    fundo: str
    letra_tipo: str
    letra_cor: str


class ModuloItem(BaseModel):
    nome: str


class Cliente(BaseModel):
    email: str
    nome_completo: str
    senha: str
    cargo: str
    funcao: str
    matricula: str | None = None


class CadastroFinal(BaseModel):
    loja: Loja
    personalizar: Personalizar
    modulos: list[ModuloItem]
    cliente: Cliente


# =========================================
# ROTA FINAL
# =========================================
@router.post("/finalizar")
def finalizar_cadastro(body: CadastroFinal):
    conn = conectar()

    try:
        conn.start_transaction()

        # 1. CADASTRAR COMÉRCIO
        comercio_id = executar_comando(
            conn,
            """
            INSERT INTO comercios_cadastradas
            (
                loja, imagem, cnpj, cep, rua, bairro, numero,
                cidade, estado, email, celular,
                fundo, letra_tipo, letra_cor
            )
            VALUES
            (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                body.loja.loja,
                body.loja.imagem,
                body.loja.cnpj,
                body.loja.cep,
                body.loja.rua,
                body.loja.bairro,
                body.loja.numero,
                body.loja.cidade,
                body.loja.estado,
                body.loja.email,
                body.loja.celular,

                # FORÇADO PARA NULL
                None,                     # fundo
                body.personalizar.letra_tipo,
                None                      # letra_cor
            )
        )

        # 2. CADASTRAR MÓDULOS DO COMÉRCIO
        for modulo in body.modulos:
            executar_comando(
                conn,
                """
                INSERT INTO modulos_comercio
                (
                    comercio_cadastrado_id,
                    modulo,
                    ativo
                )
                VALUES (%s, %s, %s)
                """,
                (
                    comercio_id,
                    modulo.nome,
                    0
                )
            )

        # 3. CLIENTE
        existe = executar_select(
            conn,
            "SELECT id FROM clientes WHERE email = %s",
            (body.cliente.email,)
        )

        if existe:
            raise HTTPException(status_code=400, detail="Email já cadastrado")

        senha_hash = bcrypt.hashpw(
            body.cliente.senha.encode(),
            bcrypt.gensalt()
        ).decode()

        codigo_unico = gerar_codigo_unico(conn, "clientes", "codigo", 20)
        qrcode_unico = gerar_codigo_unico(conn, "clientes", "qrcode", 12)

        executar_comando(
            conn,
            """
            INSERT INTO clientes
            (
                email, nome_completo, senha,
                cargo, funcao, matricula,
                codigo, qrcode, comercio_id
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                body.cliente.email,
                body.cliente.nome_completo,
                senha_hash,
                body.cliente.cargo,
                body.cliente.funcao,
                body.cliente.matricula,
                codigo_unico,
                qrcode_unico,
                comercio_id
            )
        )

        conn.commit()

        return {
            "mensagem": "Cadastro concluído com sucesso",
            "comercio_id": comercio_id,
            "codigo": codigo_unico,
            "qrcode": qrcode_unico
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        conn.close()


# =========================================
# BUSCAR COMÉRCIO
# =========================================

@router.get("/comercio/{id}")
def obter_comercio(id: int):
    conn = conectar()
    try:
        dados = executar_select(
            conn,
            "SELECT * FROM comercios_cadastradas WHERE id = %s",
            (id,)
        )

        if not dados:
            raise HTTPException(status_code=404, detail="Comércio não encontrado")

        return dados[0]

    finally:
        conn.close()
