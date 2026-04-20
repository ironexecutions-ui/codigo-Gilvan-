from fastapi import APIRouter
from database import conectar

router = APIRouter()

@router.get("/modulos/ativoss")
def listar_modulos_ativos():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            id, 
            modulo AS nome, 
            preco, 
            descricao AS texto
        FROM modulos
        WHERE ativo = 1
          AND preco > 0
        ORDER BY id ASC
    """)

    lista = cursor.fetchall()

    cursor.close()
    conn.close()

    return lista
