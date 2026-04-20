# servicos_ib.py
from fastapi import APIRouter, HTTPException
from datetime import date
from database import executar_select, executar_comando

router = APIRouter(
    prefix="/ib",
    tags=["IronBusiness"]
)

# =====================================================
# LISTAR SERVIÇOS IB
# =====================================================
@router.get("/servicos")
def listar_servicos_ib():
    sql = """
        SELECT 
            s.id,
            s.servico_ib_id,
            c.loja,
            s.servico,
            s.valor,
            s.data
        FROM servicos_ib s
        JOIN servicos_ib_aluguel a
            ON a.id = s.servico_ib_id
        JOIN comercios_cadastradas c
            ON c.id = a.comercio_id
        ORDER BY s.data DESC, s.id DESC
    """
    return executar_select(sql)


# =====================================================
# LISTAR ALUGUÉIS COM NOME DA LOJA
# =====================================================
@router.get("/alugueis")
def listar_alugueis_ib():
    sql = """
        SELECT 
            s.id AS aluguel_id,
            c.loja
        FROM servicos_ib_aluguel s
        JOIN comercios_cadastradas c
            ON c.id = s.comercio_id
        ORDER BY c.loja
    """
    return executar_select(sql)


# =====================================================
# INSERIR SERVIÇO (DATA REAL DO SERVIDOR)
# =====================================================
@router.post("/servicos")
def inserir_servico_ib(dados: dict):

    servico_ib_id = dados.get("servico_ib_id")
    servico = dados.get("servico")
    valor = dados.get("valor")

    if not servico_ib_id:
        raise HTTPException(400, "servico_ib_id obrigatório")

    if not servico or not servico.strip():
        raise HTTPException(400, "Serviço obrigatório")

    try:
        valor = float(valor)
        if valor <= 0:
            raise ValueError
    except:
        raise HTTPException(400, "Valor inválido")

    data_atual = date.today()

    sql = """
        INSERT INTO servicos_ib (
            servico_ib_id,
            servico,
            valor,
            data
        ) VALUES (%s, %s, %s, %s)
    """

    executar_comando(sql, (
        servico_ib_id,
        servico.strip(),
        valor,
        data_atual
    ))

    return {"ok": True, "data": str(data_atual)}


# =====================================================
# ATUALIZAR SERVIÇO
# =====================================================
@router.put("/servicos/{servico_id}")
def atualizar_servico(servico_id: int, dados: dict):

    servico_ib_id = dados.get("servico_ib_id")
    servico = dados.get("servico")
    valor = dados.get("valor")

    if not servico_ib_id or not servico:
        raise HTTPException(400, "Dados incompletos")

    try:
        valor = float(valor)
    except:
        raise HTTPException(400, "Valor inválido")

    sql = """
        UPDATE servicos_ib
        SET servico_ib_id = %s,
            servico = %s,
            valor = %s
        WHERE id = %s
    """

    executar_comando(sql, (
        servico_ib_id,
        servico.strip(),
        valor,
        servico_id
    ))

    return {"ok": True}


# =====================================================
# APAGAR SERVIÇO
# =====================================================
@router.delete("/servicos/{servico_id}")
def apagar_servico(servico_id: int):

    sql = "DELETE FROM servicos_ib WHERE id = %s"
    executar_comando(sql, (servico_id,))

    return {"ok": True}


# =====================================================
# TOTAL MENSAL APLICANDO % DIRETO DA TABELA USUARIOS
# =====================================================
@router.get("/totais-mensais")
def totais_mensais():

    sql = """
        SELECT
            DATE_FORMAT(data, '%Y-%m') AS mes,
            SUM(valor) AS total_bruto
        FROM servicos_ib
        GROUP BY mes
        ORDER BY mes DESC
    """

    totais = executar_select(sql)

    # ⚠️ aqui você decide a regra
    # exemplo: pegar a porcentagem do primeiro admin
    usuario = executar_select(
        "SELECT porcentagem FROM usuarios ORDER BY id LIMIT 1"
    )

    porcentagem = usuario[0]["porcentagem"] if usuario else 0

    resultado = []

    for t in totais:
        bruto = float(t["total_bruto"])
        liquido = round(bruto * (porcentagem / 100), 2)

        resultado.append({
            "mes": t["mes"],
            "total_bruto": bruto,
            "porcentagem": porcentagem,
            "total_liquido": liquido
        })

    return resultado
