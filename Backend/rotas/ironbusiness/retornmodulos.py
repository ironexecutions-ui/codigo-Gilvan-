from fastapi import APIRouter, Depends, HTTPException
from database import executar_select
from ..auth import verificar_token

router = APIRouter(prefix="/retorno")

# lista módulos cadastrados
@router.get("/modulos")
async def listar_modulos(payload = Depends(verificar_token)):
    consulta = "SELECT id, modulo, ativo FROM modulos"
    return executar_select(consulta)


# dados do cliente logado
@router.get("/me")
async def obter_me(payload = Depends(verificar_token)):
    usuario_id = payload.get("id")

    consulta = """
    SELECT 
        id,
        nome_completo AS nome,
        funcao,
        comercio_id
    FROM clientes
    WHERE id = %s
    """

    dados = executar_select(consulta, (usuario_id,))

    if not dados:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    cliente = dados[0]

    # módulos que o COMÉRCIO possui
    consulta_modulos_comercio = """
    SELECT modulo
FROM modulos_comercio
WHERE comercio_cadastrado_id = %s
AND ativo = 1

    """

    modulos_comercio = executar_select(
        consulta_modulos_comercio,
        (cliente["comercio_id"],)
    )

    cliente["modulos_comercio"] = [m["modulo"] for m in modulos_comercio]

    return cliente


# permissões do funcionário
@router.get("/permissoes/{cliente_id}")
async def listar_permissoes(cliente_id: int, payload = Depends(verificar_token)):
    consulta = """
    SELECT id, cliente_id, modulo
    FROM clientes_permissao
    WHERE cliente_id = %s
    """
    return executar_select(consulta, (cliente_id,))
