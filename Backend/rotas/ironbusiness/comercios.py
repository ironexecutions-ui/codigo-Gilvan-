# rotas/comercios.py

from fastapi import APIRouter, HTTPException
from database import executar_comando, conectar

router = APIRouter(prefix="/comercios")

@router.put("/solicitar/{comercio_id}")
def solicitar_modulo(comercio_id: int, body: dict):

    coluna = body.get("coluna")

    if not coluna:
        raise HTTPException(status_code=400, detail="Coluna não enviada")

    # Lista segura de colunas válidas
    colunas_validas = [
        "produtividade", "administracao", "delivery_vendas",
        "mesas_salao_cozinha", "integracao_ifood", "agendamentos",
        "gerencial", "fiscal"
    ]

    if coluna not in colunas_validas:
        raise HTTPException(status_code=400, detail="Módulo inválido")

    # Monta query com coluna dinâmica
    query = f"UPDATE comercios_cadastradas SET {coluna} = 1 WHERE id = %s"

    # Executa o comando corretamente
    executar_comando(query, (comercio_id,))

    return { "ok": True, "mensagem": "Módulo solicitado com sucesso" }
@router.get("/{comercio_id}")
def obter_comercio(comercio_id: int):

    conn = conectar()

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, loja, imagem, fundo, letra_tipo, letra_cor FROM comercios_cadastradas WHERE id = %s",
            (comercio_id,)
        )
        dados = cursor.fetchone()
        cursor.close()

        if not dados:
            raise HTTPException(status_code=404, detail="Comércio não encontrado")

        return dados

    finally:
        conn.close()
