from fastapi import APIRouter, Depends, HTTPException
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter()

# -------------------------------------------------
# BUSCAR PRODUTOS / SERVIÇOS DO COMÉRCIO
# -------------------------------------------------
@router.get("/produtos_servicos/buscar")
def buscar_produtos(query: str, usuario=Depends(verificar_token_cliente)):

    sql_cliente = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
    """
    dados_cliente = executar_select(sql_cliente, (usuario["id"],))

    if not dados_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    comercio_id = dados_cliente[0]["comercio_id"]

    if comercio_id is None:
        return []

    if not query or query.strip() == "":
        return []

    sql = """
SELECT 
    ps.id,
    ps.nome,
    ps.unidade,
    ps.codigo_barras,
    ps.qrcode,
    ps.preco,
    ps.preco_recebido,
    ps.categoria,
    ps.imagem_url,
    ps.tempo_servico,
    cc.imagem AS imagem_comercio
FROM produtos_servicos ps
JOIN comercios_cadastradas cc ON cc.id = ps.comercio_id
WHERE ps.comercio_id = %s
AND ps.disponivel = 1
AND (
    ps.nome LIKE %s
    OR ps.codigo_barras = %s
    OR ps.qrcode = %s
)
AND ps.id = (
    SELECT MAX(ps2.id)
    FROM produtos_servicos ps2
    WHERE ps2.comercio_id = ps.comercio_id
    AND ps2.disponivel = 1
    AND (
        ps2.nome = ps.nome
        OR (
            ps.codigo_barras IS NOT NULL
            AND ps.codigo_barras != ''
            AND ps2.codigo_barras = ps.codigo_barras
        )
    )
)
ORDER BY ps.nome ASC
LIMIT 20
"""


    dados = executar_select(sql, (
        comercio_id,
        f"%{query}%",
        query,
        query
    ))

    return dados


# -------------------------------------------------
# VERIFICAR SE O CLIENTE PODE EDITAR PREÇO
# -------------------------------------------------
@router.get("/clientes/pode-editar-preco")
def pode_editar_preco(usuario=Depends(verificar_token_cliente)):

    sql = """
        SELECT cc.editar_preco
        FROM clientes c
        JOIN comercios_cadastradas cc ON cc.id = c.comercio_id
        WHERE c.id = %s
    """
    dados = executar_select(sql, (usuario["id"],))

    if not dados:
        raise HTTPException(status_code=404, detail="Cliente ou comércio não encontrado")

    return {
        "pode_editar": dados[0]["editar_preco"] == 1
    }

# -------------------------------------------------
# ATUALIZAR PREÇO DO PRODUTO
# -------------------------------------------------
@router.put("/produtos/atualizar-preco")
def atualizar_preco(dados: dict, usuario=Depends(verificar_token_cliente)):

    produto_id = dados.get("produto_id")
    novo_preco = dados.get("novo_preco")

    if produto_id is None or novo_preco is None:
        raise HTTPException(status_code=400, detail="Dados inválidos")

    # 1. Buscar comércio e permissão
    sql_perm = """
        SELECT c.comercio_id, cc.editar_preco
        FROM clientes c
        JOIN comercios_cadastradas cc ON cc.id = c.comercio_id
        WHERE c.id = %s
    """
    dados_perm = executar_select(sql_perm, (usuario["id"],))

    if not dados_perm:
        raise HTTPException(status_code=403, detail="Cliente inválido")

    comercio_id = dados_perm[0]["comercio_id"]
    editar_preco = dados_perm[0]["editar_preco"]

    if editar_preco != 1:
        raise HTTPException(status_code=403, detail="Sem permissão para editar preço")

    # 2. Verificar se o produto pertence ao comércio
    sql_produto = """
        SELECT id
        FROM produtos_servicos
        WHERE id = %s
        AND comercio_id = %s
    """
    produto = executar_select(sql_produto, (produto_id, comercio_id))

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # 3. Atualizar preço
    sql_update = """
        UPDATE produtos_servicos
        SET preco = %s
        WHERE id = %s
    """
    executar_comando(sql_update, (novo_preco, produto_id))

    return { "status": "ok" }
# -------------------------------------------------
# OBTER MODO DE TEMA DO CLIENTE
# -------------------------------------------------
@router.get("/clientes/modo")
def obter_modo_cliente(usuario=Depends(verificar_token_cliente)):

    sql = """
        SELECT modo
        FROM clientes
        WHERE id = %s
    """

    dados = executar_select(sql, (usuario["id"],))

    return {
        "modo": dados[0]["modo"] if dados else None
    }
