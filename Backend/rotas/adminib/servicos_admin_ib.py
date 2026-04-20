from fastapi import APIRouter
from database import executar_select, executar_comando
from datetime import date

router = APIRouter(
    prefix="/admin/servicos",
    tags=["Admin Serviços IB"]
)

# =====================================================
# LISTA UNIFICADA DAS 3 TABELAS (MANTIDA 100%)
# =====================================================
@router.get("/unificado")
def listar_servicos_unificados():

    sql = """
    (
        SELECT
            'servicos_ib' AS origem,
            'ironbusiness' AS tipo_nome,
            c.loja AS loja,
            s.data AS data,
            s.valor AS valor,
            NULL AS processo
        FROM servicos_ib s
        JOIN servicos_ib_aluguel a
            ON a.id = s.servico_ib_id
        JOIN comercios_cadastradas c
            ON c.id = a.comercio_id
    )

    UNION ALL

    (
        SELECT
            'servicos' AS origem,
            'sistemas criados' AS tipo_nome,
            s.loja AS loja,
            DATE_ADD(s.data, INTERVAL s.dias DAY) AS data,
            s.valor AS valor,
            s.processo AS processo
        FROM servicos s
    )

    UNION ALL

    (
        SELECT
            'servico_ib_pagamentos' AS origem,
            'serviços de ironbusiness' AS tipo_nome,
            c.loja AS loja,
            sip.mes AS data,
            sip.valor AS valor,
            NULL AS processo
        FROM servico_ib_pagamentos sip
        JOIN comercios_cadastradas c
            ON c.id = sip.comercio_id
        WHERE sip.situacao = 'pago'
    )

    ORDER BY data DESC
    """

    return executar_select(sql)


# =====================================================
# TOTAIS POR MÊS (COM PERSISTÊNCIA EM MENSALIDADE)
# =====================================================
@router.get("/totais-mensais")
def totais_mensais():

    # -------------------------------------------------
    # 1. Usuário que define a porcentagem
    # -------------------------------------------------
    usuario = executar_select(
        "SELECT id, porcentagem FROM usuarios ORDER BY id LIMIT 1"
    )

    if not usuario:
        return []

    usuario_id = usuario[0]["id"]
    porcentagem = usuario[0]["porcentagem"]

    # -------------------------------------------------
    # 2. Meses já calculados para o usuário
    # -------------------------------------------------
    meses_existentes = executar_select(
        """
        SELECT mes
        FROM mensalidade
        WHERE usuario_id = %s
        """,
        (usuario_id,)
    )

    meses_ja_calculados = [m["mes"] for m in meses_existentes]

    filtro_mes = ""
    params = []

    if meses_ja_calculados:
        placeholders = ", ".join(["%s"] * len(meses_ja_calculados))
        filtro_mes = f"WHERE mes NOT IN ({placeholders})"
        params.extend(meses_ja_calculados)

    # -------------------------------------------------
    # 3. Buscar SOMENTE meses ainda não calculados
    # -------------------------------------------------
    sql = f"""
    SELECT
        mes,
        SUM(valor) AS total_bruto
    FROM
    (
        SELECT
            DATE_FORMAT(s.data, '%Y-%m') AS mes,
            s.valor
        FROM servicos_ib s

        UNION ALL

        SELECT
            DATE_FORMAT(DATE_ADD(s.data, INTERVAL s.dias DAY), '%Y-%m') AS mes,
            s.valor
        FROM servicos s
        WHERE s.processo = 'finalizado'

        UNION ALL

        SELECT
            DATE_FORMAT(sip.mes, '%Y-%m') AS mes,
            sip.valor
        FROM servico_ib_pagamentos sip
        WHERE sip.situacao = 'pago'
    ) t
    {filtro_mes}
    GROUP BY mes
    """

    registros = executar_select(sql, tuple(params))
    hoje = date.today()

    # -------------------------------------------------
    # 4. Calcular e SALVAR no banco
    # -------------------------------------------------
    for r in registros:
        bruto = float(r["total_bruto"])
        liquido = round(bruto * (porcentagem / 100), 2)

        executar_comando(
            """
            INSERT INTO mensalidade (usuario_id, mes, valor, data)
            VALUES (%s, %s, %s, %s)
            """,
            (usuario_id, r["mes"], liquido, hoje)
        )

    # -------------------------------------------------
    # 5. Retornar exatamente como o frontend espera
    # -------------------------------------------------
    return executar_select(
        """
        SELECT
            mes,
            valor AS total_liquido
        FROM mensalidade
        WHERE usuario_id = %s
        ORDER BY mes DESC
        """,
        (usuario_id,)
    )
