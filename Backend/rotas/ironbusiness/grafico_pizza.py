from fastapi import APIRouter, Depends, Query
from database import executar_select
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/admin/graficos",
    tags=["Admin - Gráficos"]
)
@router.get("/pizza")
def grafico_pizza(
    modo: str = Query("produtos"),
    data: str | None = Query(None),
    limite: int | None = Query(5),
    cliente=Depends(verificar_token_cliente)
):

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio:
        return []

    comercio_id = comercio[0]["comercio_id"]

    filtro_data = ""
    params = [comercio_id]

    if data:
        filtro_data = "AND data >= %s"
        params.append(data)

    # ===============================
    # PRODUTOS
    # ===============================
    if modo == "produtos":

        if not limite or limite <= 0:
            limite = 5

        sql = f"""
            SELECT produtos
            FROM vendas_ib
            WHERE empresa = %s
            {filtro_data}
        """
        vendas = executar_select(sql, tuple(params))

        mapa = {}

        for v in vendas:
            produtos_str = v.get("produtos")
            if not produtos_str:
                continue

            for item in produtos_str.split(","):
                if ":" not in item:
                    continue

                pid, qtd = item.split(":", 1)

                try:
                    qtd = int(qtd)
                except ValueError:
                    continue

                mapa[pid] = mapa.get(pid, 0) + qtd

        if not mapa:
            return []

        ids = tuple(mapa.keys())

        sql_prod = f"""
            SELECT id, nome, unidade
            FROM produtos_servicos
            WHERE id IN ({",".join(["%s"] * len(ids))})
        """
        produtos = executar_select(sql_prod, ids)

        total = sum(mapa.values()) or 1

        resultado = [
            {
                "nome": f'{p["nome"]} ({p["unidade"]})',
                "quantidade": mapa[str(p["id"])],
                "percentual": round((mapa[str(p["id"])] / total) * 100, 2)
            }
            for p in produtos
            if str(p["id"]) in mapa
        ]

        resultado.sort(key=lambda x: x["quantidade"], reverse=True)
        return resultado[:limite]

    # ===============================
    # PAGAMENTOS
    # ===============================
    if modo == "pagamentos":

        sql = f"""
            SELECT pagamento, COUNT(*) AS total
            FROM vendas_ib
            WHERE empresa = %s
            {filtro_data}
            GROUP BY pagamento
        """
        rows = executar_select(sql, tuple(params))

        total = sum(r["total"] for r in rows) or 1

        return [
            {
                "nome": r["pagamento"],
                "quantidade": r["total"],
                "percentual": round((r["total"] / total) * 100, 2)
            }
            for r in rows
        ]

    # ===============================
    # FUNCIONÁRIOS
    # ===============================
    if modo == "funcionarios":

        sql = f"""
            SELECT c.nome_completo, COUNT(*) AS total
            FROM vendas_ib v
            JOIN clientes c ON c.id = v.realizada
            WHERE v.empresa = %s
            {filtro_data}
            GROUP BY c.nome_completo
        """
        rows = executar_select(sql, tuple(params))

        total = sum(r["total"] for r in rows) or 1

        return [
            {
                "nome": r["nome_completo"],
                "quantidade": r["total"],
                "percentual": round((r["total"] / total) * 100, 2)
            }
            for r in rows
        ]

    return []
