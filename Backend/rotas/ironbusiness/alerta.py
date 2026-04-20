from fastapi import APIRouter
from database import executar_select, executar_comando

router = APIRouter()

@router.get("/jogos/msb/alerta")
def verificar_alerta():
    sql = "SELECT alerta FROM jogos_alerta WHERE id = 1"
    res = executar_select(sql)

    return {
        "alerta": res[0]["alerta"] if res else 0
    }

@router.post("/jogos/msb/alerta")
def atualizar_alerta(alerta: int):
    # garante apenas 0 ou 1
    alerta = 1 if alerta == 1 else 0

    sql = """
        UPDATE jogos_alerta
        SET alerta = %s
        WHERE id = 1
    """
    executar_comando(sql, (alerta,))

    return {
        "sucesso": True,
        "alerta": alerta
    }