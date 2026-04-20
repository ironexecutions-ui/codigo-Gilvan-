from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from database import executar_select
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/admin/vendas",
    tags=["Admin - Vendas"]
)

# ===============================
# FUNÇÃO AUXILIAR: VALIDAR ACESSO
# ===============================
def validar_acesso_admin(cliente_id: int):
    sql = """
        SELECT comercio_id, funcao
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    dados = executar_select(sql, (cliente_id,))

    if not dados:
        raise HTTPException(status_code=403, detail="Usuário não encontrado")

    funcao = dados[0]["funcao"]
    comercio_id = dados[0]["comercio_id"]

    if funcao not in ("Administrador(a)", "Supervisor(a)"):
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito à administração"
        )

    return comercio_id


# ===============================
# LISTAR VENDAS
# ===============================
@router.get("/")
def listar_vendas(cliente=Depends(verificar_token_cliente)):
    """
    Retorna o histórico de vendas do comércio do usuário logado.
    Acesso restrito a Administrador(a) e Supervisor(a).
    """

    comercio_id = validar_acesso_admin(cliente["id"])

    sql = """
        SELECT
            v.id,
            v.codigo,
            v.comanda,
            v.pagamento,
            v.valor_pago,
            v.data,
            v.hora,
            v.status,
            v.maquininha,
            v.modulo,
            v.produtos,
            c.nome_completo AS operador
        FROM vendas_ib v
        JOIN clientes c ON c.id = v.realizada
        WHERE v.empresa = %s
        ORDER BY v.data DESC, v.hora DESC
    """

    return executar_select(sql, (comercio_id,))


# ===============================
# SCHEMA PARA IDS DE PRODUTOS
# ===============================
class ProdutosIds(BaseModel):
    ids: List[int]


# ===============================
# BUSCAR PRODUTOS DA VENDA
# ===============================
@router.post("/produtos/ids")
def buscar_produtos_por_ids(
    dados: ProdutosIds,
    cliente=Depends(verificar_token_cliente)
):
    """
    Retorna produtos vinculados a uma venda.
    Acesso restrito a Administrador(a) e Supervisor(a).
    """

    if not dados.ids:
        return []

    comercio_id = validar_acesso_admin(cliente["id"])

    placeholders = ",".join(["%s"] * len(dados.ids))

    sql = f"""
        SELECT
            id,
            nome,
            unidade,
            imagem_url
        FROM produtos_servicos
        WHERE id IN ({placeholders})
          AND comercio_id = %s
    """

    params = tuple(dados.ids) + (comercio_id,)

    return executar_select(sql, params)
