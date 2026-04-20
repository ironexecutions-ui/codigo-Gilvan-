from fastapi import APIRouter, Request, Depends
from datetime import datetime
from database import executar_select, executar_comando
from .auth_sistema import verificar_token_sistema

router = APIRouter(prefix="/seguranca", tags=["Segurança"])

DADOS_ONLINE = "gAAAAABpauDXABCS8CDfm-C23BrjP8goDwfGGu63GuaCzeirmEXRTWHh4GMMHcC_apLKr2vIHF75yQ22Zi1P2Q4thEcGm3oKt0KXWAqIye0IAyOIyWsyrwEPyEuPBKJ-JvwF98bW8gquC6bmW30Rqk-YVL_1CoZv0Q=="

@router.get("/dados-conexao")
def obter_dados_conexao(
    request: Request,
    sistema=Depends(verificar_token_sistema)
):
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")

    origem = "token_sistema"  # ajuste aqui conforme sua lógica real

    # só registra auditoria se a origem NÃO for token_valido
    if origem != "token_valido":
        executar_comando("""
            INSERT INTO auditoria_acesso (ip, user_agent, origem, usuario_id, sucesso)
            VALUES (%s, %s, %s, %s, 1)
        """, (ip, user_agent, origem, None))

    return {
        "dados": DADOS_ONLINE
    }
