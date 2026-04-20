from fastapi import APIRouter, Depends, HTTPException
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente
from database import obter_comercio_id_do_cliente

router = APIRouter(prefix="/imagens", tags=["Imagens"])


@router.get("/{produto_id}")
def listar_imagens(produto_id: int, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql = """
        SELECT *
        FROM imagens
        WHERE produto_id = %s
        AND comercio_id = %s
    """

    return executar_select(sql, (produto_id, comercio_id))


@router.post("")
def adicionar_imagem(dados: dict, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql = """
        INSERT INTO imagens (comercio_id, produto_id, imagem_url)
        VALUES (%s, %s, %s)
    """

    executar_comando(sql, (
        comercio_id,
        dados["produto_id"],
        dados["imagem_url"]
    ))

    return {"status": "ok"}
