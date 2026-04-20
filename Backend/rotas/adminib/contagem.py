from fastapi import APIRouter, HTTPException
from database import executar_select

router = APIRouter(
    prefix="/admin/vendas",
    tags=["Admin - Vendas"]
)

# ===============================
# CONTAGEM DE VENDAS POR COMÉRCIO
# ===============================
@router.get("/contagem-comercios")
async def contagem_comercios():
    """
    Retorna uma linha por venda, já com:
    - id do comércio (empresa)
    - nome da loja (loja)
    - data da venda (data)
    Ignora vendas do comércio com empresa = 27.
    """

    sql = """
        SELECT
            v.empresa,
            c.loja,
            v.data
        FROM vendas_ib v
        INNER JOIN comercios_cadastradas c
            ON c.id = v.empresa
        WHERE v.empresa != 27
    """

    dados = executar_select(sql)

    if dados is None:
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar vendas"
        )

    return dados
