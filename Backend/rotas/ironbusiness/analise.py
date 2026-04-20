from fastapi import APIRouter, Depends, Query, HTTPException
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/admin/analise",
    tags=["Admin - Análise de Precificação"]
)

# =====================================================
# MARKUP DOS PRODUTOS (PRECO = VENDA | PRECO_RECEBIDO = CUSTO)
# =====================================================

@router.get("/margem-produtos")
def margem_produtos(
    limite: int = Query(5, ge=1, le=50),
    categoria: str | None = None,
    nome: str | None = None,
    cliente=Depends(verificar_token_cliente)
):
    sql = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    res = executar_select(sql, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    filtros = ["comercio_id = %s"]
    valores = [comercio_id]

    if categoria:
        filtros.append("categoria = %s")
        valores.append(categoria)

    if nome:
        filtros.append("nome LIKE %s")
        valores.append(f"%{nome}%")

    where = " AND ".join(filtros)

    sql = f"""
        SELECT
            id,
            nome,
            unidade,
            unidades,
            tempo_servico,
            preco,
            preco_recebido
        FROM produtos_servicos
        WHERE {where}
    """

    produtos = executar_select(sql, tuple(valores))

    lista_validos = []
    lista_invalidos = []
    soma_percentuais = 0

    for p in produtos:
        preco_venda = float(p["preco"] or 0)
        preco_custo = float(p["preco_recebido"] or 0)

        nome_prod = p["nome"]
        if p["unidade"]:
            nome_prod += f" {p['unidade']}"
        elif p["unidades"]:
            nome_prod += f" {p['unidades']}"
        elif p["tempo_servico"]:
            nome_prod += f" {p['tempo_servico']}"

        if preco_venda <= 0 or preco_custo <= 0:
            lista_invalidos.append({"id": p["id"]})
            continue

        lucro = preco_venda - preco_custo
        percentual = (lucro / preco_custo) * 100

        lista_validos.append({
            "id": p["id"],
            "nome": nome_prod,
            "percentual": round(percentual, 2)
        })

        soma_percentuais += percentual

    if not lista_validos:
        return {
            "percentual_medio": 0,
            "maiores": [],
            "menores": [],
            "invalidos_total": len(lista_invalidos)
        }

    percentual_medio = soma_percentuais / len(lista_validos)

    ordenado = sorted(lista_validos, key=lambda x: x["percentual"], reverse=True)

    return {
        "percentual_medio": round(percentual_medio, 2),
        "maiores": ordenado[:limite],
        "menores": list(reversed(ordenado))[:limite],
        "invalidos_total": len(lista_invalidos)
    }
@router.get("/categorias")
def listar_categorias(cliente=Depends(verificar_token_cliente)):
    sql = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    res = executar_select(sql, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    sql = """
        SELECT DISTINCT categoria
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND categoria IS NOT NULL
          AND categoria <> ''
        ORDER BY categoria
    """
    dados = executar_select(sql, (comercio_id,))

    return [d["categoria"] for d in dados]

# =====================================================
# LISTAR PRODUTOS SEM PREÇO DEFINIDO
# =====================================================
@router.get("/produtos-sem-preco")
def produtos_sem_preco(cliente=Depends(verificar_token_cliente)):
    sql = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    res = executar_select(sql, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    sql = """
        SELECT
            id,
            nome,
            preco,
            preco_recebido
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND (preco <= 0 OR preco_recebido <= 0)
    """
    return executar_select(sql, (comercio_id,))


# =====================================================
# ATUALIZAR PREÇO E CUSTO DO PRODUTO (MODAL)
# =====================================================
@router.put("/produto-preco/{produto_id}")
def atualizar_preco_produto(
    produto_id: int,
    preco: float = Query(...),
    preco_recebido: float = Query(...),
    cliente=Depends(verificar_token_cliente)
):
    # -------------------------------------------------
    # VALIDAR COMÉRCIO
    # -------------------------------------------------
    sql = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    res = executar_select(sql, (cliente["id"],))

    if not res or not res[0]["comercio_id"]:
        raise HTTPException(403, "Cliente sem comércio vinculado")

    comercio_id = res[0]["comercio_id"]

    # -------------------------------------------------
    # VALIDAR PRODUTO DO COMÉRCIO
    # -------------------------------------------------
    sql = """
        SELECT id
        FROM produtos_servicos
        WHERE id = %s
          AND comercio_id = %s
        LIMIT 1
    """
    prod = executar_select(sql, (produto_id, comercio_id))

    if not prod:
        raise HTTPException(404, "Produto não encontrado")

    # -------------------------------------------------
    # ATUALIZAR PREÇOS
    # -------------------------------------------------
    sql = """
        UPDATE produtos_servicos
        SET preco = %s,
            preco_recebido = %s
        WHERE id = %s
    """
    executar_comando(sql, (preco, preco_recebido, produto_id))

    return {"ok": True}
