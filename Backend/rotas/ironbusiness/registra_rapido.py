from random import randint
from fastapi import APIRouter, Depends, HTTPException
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter()

def gerar_codigo_unico(comercio_id):
    while True:
        codigo = "".join(str(randint(0, 9)) for _ in range(randint(23, 33)))
        existe = executar_select(
            """
            SELECT id 
            FROM produtos_servicos 
            WHERE codigo_barras = %s AND comercio_id = %s
            """,
            (codigo, comercio_id)
        )
        if not existe:
            return codigo


@router.post("/produtos_servicos/criar-rapido")
def criar_produto_rapido(dados: dict, usuario=Depends(verificar_token_cliente)):

    nome = dados.get("nome")
    codigo_barras = dados.get("codigo_barras")
    unidade = dados.get("unidade")
    preco = dados.get("preco")
    categoria = dados.get("categoria")

    if not nome:
        raise HTTPException(status_code=400, detail="Nome obrigatório")

    # buscar comercio do cliente
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not comercio or comercio[0]["comercio_id"] is None:
        raise HTTPException(status_code=403, detail="Cliente sem comércio")

    comercio_id = comercio[0]["comercio_id"]

    # validar ou gerar código respeitando o comércio
    if codigo_barras:
        existe = executar_select(
            """
            SELECT id 
            FROM produtos_servicos 
            WHERE codigo_barras = %s AND comercio_id = %s
            """,
            (codigo_barras, comercio_id)
        )
        if existe:
            codigo_barras = gerar_codigo_unico(comercio_id)
    else:
        codigo_barras = gerar_codigo_unico(comercio_id)


    sql = """
        INSERT INTO produtos_servicos
        (nome, codigo_barras, unidade, preco, categoria, disponivel, comercio_id)
        VALUES (%s, %s, %s, %s, %s, 1, %s)
    """

    executar_comando(sql, (
        nome,
        codigo_barras,
        unidade,
        preco,
        categoria,
        comercio_id
    ))

    produto = executar_select(
        """
        SELECT * 
        FROM produtos_servicos 
        WHERE codigo_barras = %s AND comercio_id = %s
        """,
        (codigo_barras, comercio_id)
    )

    return produto[0]


@router.get("/produtos_servicos/buscar-exato")
def buscar_produto_exato(valor: str, usuario=Depends(verificar_token_cliente)):

    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not comercio or not comercio[0]["comercio_id"]:
        return None

    comercio_id = comercio[0]["comercio_id"]

    # normaliza valor
    valor = valor.strip()

    sql = """
        SELECT *
        FROM produtos_servicos
        WHERE comercio_id = %s
        AND disponivel = 1
        AND (
            codigo_barras = %s
            OR qrcode = %s
            OR nome LIKE %s
        )
        ORDER BY
            CASE
                WHEN codigo_barras = %s THEN 1
                WHEN qrcode = %s THEN 2
                ELSE 3
            END
        LIMIT 1
    """

    dados = executar_select(sql, (
        comercio_id,
        valor,
        valor,
        f"%{valor}%",
        valor,
        valor
    ))

    return dados[0] if dados else None