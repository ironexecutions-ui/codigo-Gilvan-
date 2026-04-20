from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import random
import string
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/admin/codigos",
    tags=["Admin - Códigos"]
)

# ===============================
# MODELS
# ===============================

class DesignarRequest(BaseModel):
    ids: List[int]
    tipo: str  # "codigo_barras" ou "qrcode"


# ===============================
# FUNÇÕES AUXILIARES
# ===============================

def obter_comercio_id(cliente_id: int):
    sql = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    dados = executar_select(sql, (cliente_id,))
    if not dados:
        return None
    return dados[0]["comercio_id"]



def gerar_codigo_unico(coluna: str):
    while True:
        tamanho = random.randint(25, 35)

        if coluna == "codigo_barras":
            # SOMENTE números
            codigo = "".join(str(random.randint(0, 9)) for _ in range(tamanho))

        elif coluna == "qrcode":
            # Letras + números
            caracteres = string.ascii_uppercase + string.digits
            codigo = "".join(random.choice(caracteres) for _ in range(tamanho))

        else:
            raise ValueError("Coluna inválida")

        sql = f"""
            SELECT id
            FROM produtos_servicos
            WHERE {coluna} = %s
            LIMIT 1
        """
        existe = executar_select(sql, (codigo,))

        if not existe:
            return codigo


# ===============================
# LISTAR PRODUTOS DO COMÉRCIO
# ===============================

@router.get("/produtos")
def listar_produtos(cliente=Depends(verificar_token_cliente)):

    comercio_id = obter_comercio_id(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=403,
            detail="Usuário sem comércio vinculado"
        )

    sql = """
        SELECT
            id,
            nome,
            codigo_barras,
            qrcode,
            unidade,
            unidades,
            tempo_servico,
            categoria
        FROM produtos_servicos
        WHERE comercio_id = %s
        ORDER BY nome
    """

    return executar_select(sql, (comercio_id,))


# ===============================
# DESIGNAR CÓDIGOS EM MASSA
# ===============================

@router.post("/designar")
def designar_codigos(
    dados: DesignarRequest,
    cliente=Depends(verificar_token_cliente)
):

    if dados.tipo not in ["codigo_barras", "qrcode"]:
        raise HTTPException(
            status_code=400,
            detail="Tipo inválido"
        )

    comercio_id = obter_comercio_id(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=403,
            detail="Usuário sem comércio vinculado"
        )

    for produto_id in dados.ids:

        # Garante que o produto é do mesmo comércio
        sql_validacao = """
            SELECT id
            FROM produtos_servicos
            WHERE id = %s
            AND comercio_id = %s
            LIMIT 1
        """
        produto = executar_select(
            sql_validacao,
            (produto_id, comercio_id)
        )

        if not produto:
            continue

        # Verifica se já existe código
        sql_atual = f"""
            SELECT {dados.tipo}
            FROM produtos_servicos
            WHERE id = %s
            LIMIT 1
        """
        atual = executar_select(sql_atual, (produto_id,))

        if atual and atual[0][dados.tipo]:
            continue

        codigo = gerar_codigo_unico(dados.tipo)

        sql_update = f"""
            UPDATE produtos_servicos
            SET {dados.tipo} = %s
            WHERE id = %s
        """
        executar_comando(sql_update, (codigo, produto_id))

    return {
        "status": "ok",
        "mensagem": "Códigos designados com sucesso"
    }
