from fastapi import APIRouter, Depends, HTTPException
from database import executar_select, obter_comercio_id_do_cliente
from .auth_clientes import verificar_token_cliente
from fastapi import Body
from database import executar_comando
router = APIRouter()


@router.get("/comercio/cambio")
async def obter_cambio(usuario=Depends(verificar_token_cliente)):

    cliente_id = usuario["id"]

    comercio_id = obter_comercio_id_do_cliente(cliente_id)

    if not comercio_id:
        raise HTTPException(
            status_code=404,
            detail="Comércio não encontrado para este cliente"
        )

    sql = """
        SELECT converte, cambio
        FROM comercios_cadastradas
        WHERE id = %s
    """

    resultado = executar_select(sql, (comercio_id,))

    if not resultado:
        raise HTTPException(
            status_code=404,
            detail="Comércio não encontrado"
        )

    dados = resultado[0]

    return {
        "converte": int(dados["converte"]),
        "cambio": float(dados["cambio"]) if dados["cambio"] is not None else None
    }


@router.put("/comercio/cambio")
async def atualizar_cambio(
    dados: dict = Body(...),
    usuario=Depends(verificar_token_cliente)
):

    cliente_id = usuario["id"]
    comercio_id = obter_comercio_id_do_cliente(cliente_id)

    if not comercio_id:
        raise HTTPException(status_code=404, detail="Comércio não encontrado")

    converte = int(dados.get("converte", 0))
    cambio = dados.get("cambio")

    sql = """
        UPDATE comercios_cadastradas
        SET converte = %s,
            cambio = %s
        WHERE id = %s
    """

    executar_comando(sql, (converte, cambio, comercio_id))

    return {"msg": "Atualizado com sucesso"}