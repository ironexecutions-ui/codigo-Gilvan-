from fastapi import APIRouter, Request
from database import conectar

router = APIRouter()

# verificar email
@router.get("/verificar-email")
def verificar_email(email: str):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT email FROM usuarios WHERE email = %s", (email,))
    dados = cursor.fetchone()

    cursor.close()
    conn.close()

    return {"existe": bool(dados)}


# verificar senha sem criptografia
@router.post("/verificar-senha")
async def verificar_senha(request: Request):
    body = await request.json()
    email = body.get("email")
    senha = body.get("senha")

    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT senha FROM usuarios WHERE email = %s", (email,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return {"ok": False}

    if senha == user["senha"]:
        return {"ok": True}

    return {"ok": False}


# dados do funcionário
@router.get("/dados-funcionario")
def dados_funcionario(email: str):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
    dados = cursor.fetchone()

    cursor.close()
    conn.close()

    return dados


# listar todos
@router.get("/usuarios/todos")
def listar_usuarios():
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM usuarios ORDER BY id DESC")
    dados = cursor.fetchall()

    cursor.close()
    conn.close()

    return dados

# inserir novo usuário
@router.post("/usuarios/inserir")
async def inserir_usuario(request: Request):
    body = await request.json()

    nome = body.get("nome")
    sobrenome = body.get("sobrenome")
    email = body.get("email")
    senha = body.get("senha")
    funcao = body.get("funcao")
    responsabilidade = body.get("responsabilidade")
    porcentagem = body.get("porcentagem")
    foto = body.get("foto")
    celular = body.get("celular")

    conn = conectar()
    cursor = conn.cursor()

    query = """
        INSERT INTO usuarios 
        (nome, sobrenome, email, senha, funcao, responsabilidade, porcentagem, foto, celular)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (nome, sobrenome, email, senha, funcao, responsabilidade, porcentagem, foto, celular))
    conn.commit()

    cursor.close()
    conn.close()

    return {"ok": True, "mensagem": "Usuário criado com sucesso"}



# apagar usuário
@router.delete("/usuarios/apagar")
def apagar_usuario(id: int):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"ok": True, "mensagem": "Usuário apagado com sucesso"}
# atualizar usuário corretamente sem sobrescrever tudo
@router.put("/usuarios/atualizar")
async def atualizar_usuario(request: Request):
    body = await request.json()

    user_id = body.get("id")
    if not user_id:
        return {"ok": False, "erro": "ID ausente"}

    # remove o ID para sobrar só os campos que vão ser atualizados
    body.pop("id")

    # se não mandou nenhum campo, retorna erro
    if not body:
        return {"ok": False, "erro": "Nenhum campo enviado"}

    # monta o SET dinâmico
    set_clauses = ", ".join([f"{campo} = %s" for campo in body.keys()])
    valores = list(body.values())

    conn = conectar()
    cursor = conn.cursor()

    query = f"UPDATE usuarios SET {set_clauses} WHERE id = %s"

    cursor.execute(query, valores + [user_id])
    conn.commit()

    cursor.close()
    conn.close()

    return {"ok": True, "mensagem": "Usuário atualizado com sucesso"}
