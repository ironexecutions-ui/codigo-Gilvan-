from fastapi import APIRouter, Depends, Query
from database import executar_select
from .auth_clientes import verificar_token_cliente
from datetime import date, timedelta

router = APIRouter(
    prefix="/admin/graficos",
    tags=["Admin - Gráficos"]
)

@router.get("/linhas")
def grafico_linhas(
    periodo: str = Query("dias"),  # dias | semanas | meses
    cliente=Depends(verificar_token_cliente)
):

    # ===============================
    # COMÉRCIO DO USUÁRIO
    # ===============================
    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio:
        return []

    comercio_id = comercio[0]["comercio_id"]

    hoje = date.today()
    resultado = []

    # ===============================
    # ÚLTIMOS 7 DIAS
    # ===============================
    if periodo == "dias":

        inicio = hoje - timedelta(days=6)

        sql = """
            SELECT data, SUM(valor_pago) AS total
            FROM vendas_ib
            WHERE empresa = %s
              AND data >= %s
            GROUP BY data
        """
        rows = executar_select(sql, (comercio_id, inicio))

        mapa = {r["data"]: float(r["total"]) for r in rows}

        for i in range(7):
            dia = inicio + timedelta(days=i)
            resultado.append({
                "label": dia.strftime("%d/%m"),
                "total": round(mapa.get(dia, 0), 2)
            })

        return resultado

    # ===============================
    # ÚLTIMAS 7 SEMANAS (CORRIGIDO)
    # ===============================
    if periodo == "semanas":

        # começo da semana atual (segunda-feira)
        inicio_semana_atual = hoje - timedelta(days=hoje.weekday())

        # voltamos 6 semanas
        inicio = inicio_semana_atual - timedelta(weeks=6)

        sql = """
            SELECT
                YEAR(data) AS ano,
                WEEK(data, 1) AS semana,
                SUM(valor_pago) AS total
            FROM vendas_ib
            WHERE empresa = %s
              AND data >= %s
            GROUP BY ano, semana
        """
        rows = executar_select(sql, (comercio_id, inicio))

        mapa = {
            (r["ano"], r["semana"]): float(r["total"])
            for r in rows
        }

        for i in range(7):
            semana_data = inicio + timedelta(weeks=i)
            iso = semana_data.isocalendar()

            ano = iso.year
            semana = iso.week

            resultado.append({
                "label": f"Sem {semana}",
                "total": round(mapa.get((ano, semana), 0), 2)
            })

        return resultado

    # ===============================
    # ÚLTIMOS 7 MESES
    # ===============================
    if periodo == "meses":

        inicio = date(hoje.year, hoje.month, 1) - timedelta(days=180)

        sql = """
            SELECT
                YEAR(data) AS ano,
                MONTH(data) AS mes,
                SUM(valor_pago) AS total
            FROM vendas_ib
            WHERE empresa = %s
              AND data >= %s
            GROUP BY ano, mes
            ORDER BY ano, mes
        """
        rows = executar_select(sql, (comercio_id, inicio))

        mapa = {
            f'{r["ano"]}-{r["mes"]:02d}': float(r["total"])
            for r in rows
        }

        ano = hoje.year
        mes = hoje.month

        for _ in range(7):
            chave = f"{ano}-{mes:02d}"

            resultado.insert(0, {
                "label": f"{mes:02d}/{ano}",
                "total": round(mapa.get(chave, 0), 2)
            })

            mes -= 1
            if mes == 0:
                mes = 12
                ano -= 1

        return resultado

    return []
