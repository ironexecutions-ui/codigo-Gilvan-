from fastapi import APIRouter, HTTPException
from database import conectar, executar_select
 
router = APIRouter(prefix="/cadastrados")


@router.get("/comercios_cadastradas")
def listar_comercios():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                loja,
                imagem,
                IFNULL(nota, NULL) AS nota
            FROM comercios_cadastradas
            ORDER BY loja ASC
        """)

        dados = cursor.fetchall()

        cursor.close()
        conn.close()

        return dados

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar lojas, {e}")
# rotas/comercios.py



@router.get("/detalhe/{id}")
def get_comercio(id: int):
    dados = executar_select(
        "SELECT id, loja, imagem FROM comercios_cadastradas WHERE id = %s",
        (id,)
    )

    if not dados:
        raise HTTPException(status_code=404, detail="Comércio não encontrado")

    return dados[0]
