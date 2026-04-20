# servicos_ib.py
from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import executar_select, executar_comando

router = APIRouter(prefix="/ib", tags=["IronBusiness"])


# =====================================================
# LISTAR COMÉRCIOS (PARA DATALIST)
# =====================================================
@router.get("/comercios")
def listar_comercios_ib():
    sql = """
        SELECT id, loja
        FROM comercios_cadastradas
        ORDER BY loja
    """
    return executar_select(sql)


# =====================================================
# LISTAR MENSALIDADES
# =====================================================
@router.get("/mensalidades")
def listar_mensalidades():
    sql = """
        SELECT
            s.id,
            s.comercio_id,
            s.data_inicio,
            s.valor,
            c.loja,
            c.imagem,
            c.celular,

            CASE
                WHEN p.situacao = 'pago' THEN 'pago'

                WHEN p.situacao = 'espera'
                    AND TIMESTAMPDIFF(
                        MONTH,
                        p.mes,
                        CURDATE()
                    ) <= 1
                THEN 'espera'

                WHEN p.situacao = 'espera'
                    AND TIMESTAMPDIFF(
                        MONTH,
                        p.mes,
                        CURDATE()
                    ) > 1
                THEN 'atrasado'

                ELSE 'espera'
            END AS situacao

        FROM servicos_ib_aluguel s

        JOIN comercios_cadastradas c
            ON c.id = s.comercio_id

        LEFT JOIN servico_ib_pagamentos p
            ON p.id = (
                SELECT sp.id
                FROM servico_ib_pagamentos sp
                WHERE sp.comercio_id = s.comercio_id
                AND sp.mes <= CURDATE()
                ORDER BY sp.mes DESC
                LIMIT 1
            )

        ORDER BY s.data_inicio DESC

    """
    return executar_select(sql)

# =====================================================
# CRIAR MENSALIDADE
# =====================================================
@router.post("/mensalidades")
def criar_mensalidade(dados: dict):

    comercio_id = dados.get("comercio_id")
    valor = dados.get("valor")
    situacao = dados.get("situacao", "espera")
    data_mes = dados.get("data_mes")

    if not comercio_id or not valor or not data_mes:
        raise HTTPException(
            status_code=400,
            detail="Dados obrigatórios não informados"
        )

    try:
        data_obj = datetime.strptime(data_mes, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Formato de data inválido"
        )

    data_inicio = data_mes
    mes_ano = data_obj.strftime("%Y-%m-01")

    executar_comando("""
        INSERT INTO servicos_ib_aluguel
        (comercio_id, data_inicio, valor, situacao)
        VALUES (%s, %s, %s, %s)
    """, (comercio_id, data_inicio, valor, situacao))

    executar_comando("""
        INSERT INTO servico_ib_pagamentos
        (comercio_id, mes, situacao)
        VALUES (%s, %s, %s)
    """, (comercio_id, mes_ano, situacao))

    return {"status": "ok"}
