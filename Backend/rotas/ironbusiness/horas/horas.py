from fastapi import APIRouter, Depends, HTTPException
from database import executar_select, executar_comando
from ..auth_clientes import verificar_token_cliente
from datetime import date, timedelta

router = APIRouter(prefix="/horas", tags=["Horas"])

HORAS_SEMANAIS = 20.0


def calcular_saldo_ate_semana(semana_inicio: date):
    registros = executar_select("""
        SELECT horas FROM horas
        WHERE semana_inicio < %s
        ORDER BY semana_inicio ASC
    """, (semana_inicio,))

    saldo = 0.0
    for r in registros:
        saldo += HORAS_SEMANAIS
        saldo -= float(r["horas"])

    return saldo

@router.get("/semanas")
def listar_semanas(usuario=Depends(verificar_token_cliente)):
    return executar_select("""
        SELECT 
            semana_inicio,
            semana_fim,
            SUM(horas) as total_horas
        FROM horas
        GROUP BY semana_inicio, semana_fim
        ORDER BY semana_inicio DESC
    """)

@router.get("/detalhes")
def detalhes_semana(semana_inicio: date, usuario=Depends(verificar_token_cliente)):
    return executar_select("""
        SELECT id, horas, de_ate, relato, criado_em
        FROM horas
        WHERE semana_inicio = %s
        ORDER BY criado_em ASC
    """, (semana_inicio,))

@router.post("/registrar")
def registrar_horas(dados: dict, usuario=Depends(verificar_token_cliente)):

    # pega o ID do cliente logado
    cliente_id = usuario.get("id") or usuario.get("cliente_id")

    if not cliente_id:
        raise HTTPException(status_code=401, detail="Usuário inválido")

    # busca o comercio_id REAL no banco
    cliente = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente_id,))

    if not cliente:
        raise HTTPException(status_code=403, detail="Cliente não encontrado")

    comercio_id = cliente[0]["comercio_id"]

    # somente comercio_id 11 pode registrar
    if comercio_id != 11:
        raise HTTPException(status_code=403, detail="Sem permissão para registrar horas")

    executar_comando("""
        INSERT INTO horas 
        (semana_inicio, semana_fim, horas, de_ate, relato)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        dados["semana_inicio"],
        dados["semana_fim"],
        dados["horas"],
        dados["de_ate"],
        dados.get("relato")
    ))

    return {"status": "ok"}
def semana_atual():
    hoje = date.today()
    inicio = hoje - timedelta(days=hoje.weekday())
    fim = inicio + timedelta(days=6)
    return inicio, fim


@router.get("/saldo-atual")
def saldo_atual(usuario=Depends(verificar_token_cliente)):

    hoje = date.today()
    inicio_semana_atual = hoje - timedelta(days=hoje.weekday())

    # todas as semanas já iniciadas
    semanas = executar_select("""
        SELECT DISTINCT semana_inicio
        FROM horas
        WHERE semana_inicio <= %s
    """, (inicio_semana_atual,))

    total_semanas = len(semanas)

    # total de horas disponíveis até agora
    horas_disponiveis = total_semanas * 20

    # total de horas usadas em TODAS as semanas até agora
    usadas = executar_select("""
        SELECT COALESCE(SUM(horas), 0) as total
        FROM horas
        WHERE semana_inicio <= %s
    """, (inicio_semana_atual,))

    horas_usadas = float(usadas[0]["total"])

    saldo_calculado = horas_disponiveis - horas_usadas

    # Nunca pode ultrapassar 40
    saldo_semana_atual = min(saldo_calculado, 40)

    # Próxima semana soma 20, mas também respeita o limite
    saldo_proxima_semana = min(saldo_semana_atual + 20, 40)


    return {
        "saldo_semana_atual": round(saldo_semana_atual, 2),
        "saldo_proxima_semana": round(saldo_proxima_semana, 2)
    }
@router.delete("/apagar/{id}")
def apagar_hora(id: int, usuario=Depends(verificar_token_cliente)):
    cliente = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not cliente or cliente[0]["comercio_id"] != 11:
        raise HTTPException(status_code=403, detail="Sem permissão")

    executar_comando("DELETE FROM horas WHERE id = %s", (id,))
    return {"status": "ok"}
