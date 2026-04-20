from fastapi import APIRouter, HTTPException
from database import conectar

router = APIRouter(prefix="/modulos")

def executar_select(conn, query, params=()):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    dados = cursor.fetchall()
    cursor.close()
    return dados


@router.get("/ativos/publico")
def listar_modulos_publicos():
    conn = conectar()
    try:
        dados = executar_select(
            conn,
            """
            SELECT 
                id,
                modulo AS nome,
                descricao AS texto,
                preco,
                ativo
            FROM modulos
            WHERE ativo = 1
            ORDER BY modulo ASC
            """
        )

        return dados

    except Exception as err:
        print("ERRO AO BUSCAR MÓDULOS:", err)
        raise HTTPException(status_code=500, detail="Erro ao buscar módulos")

    finally:
        conn.close()
