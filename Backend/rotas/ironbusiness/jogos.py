from fastapi import APIRouter, HTTPException
from database import executar_insert, executar_select, executar_comando
from .jogos_utils import gerar_codigo_jogo

router = APIRouter(prefix="/jogos", tags=["Jogos"])


# ======================================================
# REGISTRAR JOGO
# ======================================================
@router.post("/registrar")
def registrar_jogos(payload: dict):

    quantos = payload.get("quantos", 0)

    if quantos <= 0:
        return {"status": "ignorado"}

    codigo = gerar_codigo_jogo()

    executar_insert(
        """
        INSERT INTO jogos (codigo, quantos, pontos)
        VALUES (%s, %s, %s)
        """,
        (codigo, quantos, 0)
    )

    return {
        "status": "ok",
        "codigo": codigo,
        "quantos": quantos
    }


# ======================================================
# BUSCAR PONTOS PELO CÓDIGO
# ======================================================
@router.get("/pontos/{codigo}")
def buscar_pontos(codigo: str):

    if not codigo or len(codigo) != 4:
        raise HTTPException(status_code=400, detail="Código inválido")

    resultado = executar_select(
        """
        SELECT pontos
        FROM jogos
        WHERE codigo = %s
        """,
        (codigo,)
    )

    if not resultado:
        raise HTTPException(status_code=404, detail="Código não encontrado")

    return {
        "codigo": codigo,
        "pontos": resultado[0]["pontos"]
    }


# ======================================================
# ENTREGAR PRÊMIO (SUBTRAI PONTOS)
# ======================================================
@router.post("/entregar-premio")
def entregar_premio(payload: dict):

    codigo = payload.get("codigo")
    pontos_usados = payload.get("pontos_usados")

    if not codigo or len(codigo) != 4:
        raise HTTPException(status_code=400, detail="Código inválido")

    if not isinstance(pontos_usados, int) or pontos_usados <= 0:
        raise HTTPException(status_code=400, detail="Valor de pontos inválido")

    resultado = executar_select(
        """
        SELECT pontos
        FROM jogos
        WHERE codigo = %s
        """,
        (codigo,)
    )

    if not resultado:
        raise HTTPException(status_code=404, detail="Código não encontrado")

    pontos_atuais = resultado[0]["pontos"]

    if pontos_usados > pontos_atuais:
        raise HTTPException(
            status_code=400,
            detail="Pontos solicitados maior que o disponível"
        )

    pontos_restantes = pontos_atuais - pontos_usados

    executar_comando(
        """
        UPDATE jogos
        SET pontos = %s
        WHERE codigo = %s
        """,
        (pontos_restantes, codigo)
    )

    return {
        "status": "ok",
        "codigo": codigo,
        "pontos_anteriores": pontos_atuais,
        "pontos_usados": pontos_usados,
        "pontos_restantes": pontos_restantes
    }
# ======================================================
# UNIFICAR PONTOS DE VÁRIOS CÓDIGOS
# POST /jogos/unificar
# ======================================================
@router.post("/unificar")
def unificar_pontos(payload: dict):

    principal = payload.get("principal")
    codigos = payload.get("codigos", [])

    if not principal or len(principal) != 4:
        raise HTTPException(status_code=400, detail="Código principal inválido")

    if not codigos or principal not in codigos:
        raise HTTPException(status_code=400, detail="Lista de códigos inválida")

    # busca pontos de todos os códigos
    resultado = executar_select(
        f"""
        SELECT codigo, pontos
        FROM jogos
        WHERE codigo IN ({','.join(['%s'] * len(codigos))})
        """,
        tuple(codigos)
    )

    if not resultado or len(resultado) != len(codigos):
        raise HTTPException(status_code=404, detail="Um ou mais códigos não encontrados")

    total = sum(r["pontos"] for r in resultado)

    # zera todos os códigos
    executar_comando(
        f"""
        UPDATE jogos
        SET pontos = 0
        WHERE codigo IN ({','.join(['%s'] * len(codigos))})
        """,
        tuple(codigos)
    )

    # coloca tudo no principal
    executar_comando(
        """
        UPDATE jogos
        SET pontos = %s
        WHERE codigo = %s
        """,
        (total, principal)
    )

    return {
        "status": "ok",
        "codigo_principal": principal,
        "pontos_total": total
    }
