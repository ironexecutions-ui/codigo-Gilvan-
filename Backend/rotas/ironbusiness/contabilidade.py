from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/admin/contabilidade",
    tags=["Admin - Contabilidade"]
)

# ===============================
# SCHEMA
# ===============================
class AjusteContabilidade(BaseModel):
    produto_id: int
    quantos: int


# ===============================
# AJUSTAR CONTAGEM
# ===============================
@router.post("/ajustar")
def ajustar_contagem(
    dados: AjusteContabilidade,
    cliente=Depends(verificar_token_cliente)
):

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio:
        raise HTTPException(
            status_code=403,
            detail="Usuário sem comércio vinculado"
        )

    comercio_id = comercio[0]["comercio_id"]
    cliente_id = cliente["id"]

    if dados.quantos == 0:
        return {"status": "ignorado"}

    # 1️⃣ inserir ou somar no saldo
    executar_comando("""
        INSERT INTO soma_produtos
        (comercio_id, produto_id, quantos, cliente_id, data_hora)
        VALUES (%s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            quantos = quantos + VALUES(quantos),
            cliente_id = VALUES(cliente_id),
            data_hora = NOW()
    """, (
        comercio_id,
        dados.produto_id,
        dados.quantos,
        cliente_id
    ))

    # 2️⃣ buscar o id da soma
    soma = executar_select("""
        SELECT id
        FROM soma_produtos
        WHERE comercio_id = %s
          AND produto_id = %s
        LIMIT 1
    """, (
        comercio_id,
        dados.produto_id
    ))

    if not soma:
        raise HTTPException(500, "Erro ao localizar soma do produto")

    soma_id = soma[0]["id"]

    # 3️⃣ inserir histórico
  # 3️⃣ inserir histórico
    executar_comando("""
    INSERT INTO historico_soma
    (soma_id, quantos, cliente_id, data_hora)
    VALUES (%s, %s, %s, DATE_SUB(NOW(), INTERVAL 3 HOUR))
""", (
    soma_id,
    dados.quantos,
    cliente_id
))


    return {"status": "ok"}

# ===============================
# LISTAR CONTABILIDADE
# ===============================
@router.get("/")
def listar_contabilidade(cliente=Depends(verificar_token_cliente)):

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio:
        raise HTTPException(403, "Usuário sem comércio vinculado")

    comercio_id = comercio[0]["comercio_id"]

    produtos = executar_select("""
        SELECT 
            id,
            nome,
            codigo_barras,
            COALESCE(unidade, unidades, 0) AS quantidade_base
        FROM produtos_servicos
        WHERE tempo_servico IS NULL
          AND comercio_id = %s
    """, (comercio_id,))

    soma = executar_select("""
        SELECT produto_id, SUM(quantos) total
        FROM soma_produtos
        WHERE comercio_id = %s
        GROUP BY produto_id
    """, (comercio_id,))

    mapa_soma = {s["produto_id"]: s["total"] for s in soma}

    vendas = executar_select("""
        SELECT produtos
        FROM vendas_ib
        WHERE empresa = %s
    """, (comercio_id,))

    vendidos = {}
    for v in vendas:
        if not v["produtos"]:
            continue
        for item in v["produtos"].split(","):
            pid, qtd = item.split(":")
            vendidos[int(pid)] = vendidos.get(int(pid), 0) + int(qtd)

    lista = []
    erros = []          # mantido conforme pedido
    sem_contagem = 0

    for p in produtos:
        pid = p["id"]

        try:
            quantidade_base = int(p["quantidade_base"])
        except (TypeError, ValueError):
            quantidade_base = 0

        # ===============================
        # PRODUTO AINDA NÃO SOMADO
        # ===============================
        if pid not in mapa_soma:
            sem_contagem += 1

            quantidade = quantidade_base - vendidos.get(pid, 0)

            lista.append({
                "id": pid,
                "nome": p["nome"],
                "codigo_barras": p["codigo_barras"],
                "quantidade": quantidade,
                "nao_somado": True,
                "negativo": quantidade < 0
            })
            continue

        # ===============================
        # PRODUTO SOMADO
        # ===============================
        quantidade = (
            quantidade_base
            - vendidos.get(pid, 0)
            + mapa_soma.get(pid, 0)
        )

        lista.append({
            "id": pid,
            "nome": p["nome"],
            "codigo_barras": p["codigo_barras"],
            "quantidade": quantidade,
            "nao_somado": False,
            "negativo": quantidade < 0
        })

    return {
        "produtos": lista,
        "erros": erros,
        "sem_contagem": sem_contagem
    }
