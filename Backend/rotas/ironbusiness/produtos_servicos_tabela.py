from fastapi import APIRouter, Depends, HTTPException
from database import (
    executar_select,
    executar_comando,
    obter_comercio_id_do_cliente
)
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/produtos_servicos_tabela",
    tags=["Produtos e Serviços"]
)

# ===============================
# LISTAR PRODUTOS DO COMÉRCIO
# ===============================
@router.get("/")
def listar_produtos(cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql = """
        SELECT *
        FROM produtos_servicos
        WHERE comercio_id = %s
        ORDER BY nome
    """

    return executar_select(sql, (comercio_id,))


# ===============================
# LISTAR CATEGORIAS
# ===============================
@router.get("/categorias")
def listar_categorias(cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql = """
        SELECT DISTINCT categoria
        FROM produtos_servicos
        WHERE comercio_id = %s
        AND categoria IS NOT NULL
        AND categoria <> ''
    """

    rows = executar_select(sql, (comercio_id,))
    return [r["categoria"] for r in rows]


# ===============================
# CRIAR PRODUTO / SERVIÇO
# ===============================
@router.post("/")
def criar_produto(dados: dict, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql = """
        INSERT INTO produtos_servicos (
            nome,
            unidade,
            unidades,
            tempo_servico,
            preco,
            preco_recebido,
            categoria,
            imagem_url,
            disponivel,
            comercio_id
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    executar_comando(sql, (
        dados.get("nome"),
        dados.get("unidade"),
        dados.get("unidades"),
        dados.get("tempo_servico"),
        dados.get("preco"),
        dados.get("preco_recebido"),
        dados.get("categoria"),
        dados.get("imagem_url"),
        dados.get("disponivel", 1),
        comercio_id
    ))

    return {"status": "ok"}


# ===============================
# ATUALIZAR PRODUTO
# ===============================
@router.put("/{produto_id}")
def atualizar_produto(produto_id: int, dados: dict, cliente=Depends(verificar_token_cliente)):


    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    sql_check = """
        SELECT comercio_id
        FROM produtos_servicos
        WHERE id = %s
    """

    prod = executar_select(sql_check, (produto_id,))
    if not prod:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    if prod[0]["comercio_id"] != comercio_id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado"
        )

    sql = """
        UPDATE produtos_servicos SET
            nome = %s,
            unidade = %s,
            unidades = %s,
            tempo_servico = %s,
            preco = %s,
            preco_recebido = %s,
            categoria = %s,
            imagem_url = %s,
            disponivel = %s
        WHERE id = %s
    """

    executar_comando(sql, (
        dados.get("nome"),
        dados.get("unidade"),
        dados.get("unidades"),
        dados.get("tempo_servico"),
        dados.get("preco"),
        dados.get("preco_recebido"),
        dados.get("categoria"),
        dados.get("imagem_url"),
        dados.get("disponivel"),
        produto_id
    ))

    return {"status": "ok"}
# ===============================
# APAGAR PRODUTO
# ===============================
@router.delete("/{produto_id}")
def apagar_produto(
    produto_id: int,
    cliente=Depends(verificar_token_cliente)
):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    if not comercio_id:
        raise HTTPException(
            status_code=400,
            detail="Cliente sem comércio vinculado"
        )

    # verifica se o produto existe e pertence ao comércio
    sql_check = """
        SELECT id
        FROM produtos_servicos
        WHERE id = %s AND comercio_id = %s
    """

    prod = executar_select(sql_check, (produto_id, comercio_id))
    if not prod:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    # apaga imagens extras primeiro (boa prática)
    executar_comando(
        "DELETE FROM imagens WHERE produto_id = %s AND comercio_id = %s",
        (produto_id, comercio_id)
    )

    # apaga o produto
    executar_comando(
        "DELETE FROM produtos_servicos WHERE id = %s",
        (produto_id,)
    )

    return {"status": "ok"}
