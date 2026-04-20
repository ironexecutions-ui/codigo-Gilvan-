from fastapi import APIRouter, HTTPException
from database import conectar
import bcrypt
import jwt
import datetime

CHAVE = "ironexecutions_super_secreto_2025"

router = APIRouter(prefix="/login")
def criar_token(usuario):
    payload = {
        "id": usuario["id"],
        "email": usuario["email"],
        "nome": usuario["nome_completo"],
        "funcao": usuario["funcao"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=2)
    }

    return jwt.encode(payload, CHAVE, algorithm="HS256")

def executar_select(query, params=()):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    dados = cursor.fetchall()
    cursor.close()
    conn.close()
    return dados
@router.post("/email")
def login_email(dados: dict):
    email = dados.get("email")
    senha = dados.get("senha")

    usuario = executar_select("SELECT * FROM clientes WHERE email = %s", (email,))

    if not usuario:
        raise HTTPException(status_code=401, detail="Email não encontrado")

    usuario = usuario[0]

    if not bcrypt.checkpw(senha.encode(), usuario["senha"].encode()):
        raise HTTPException(status_code=401, detail="Senha incorreta")

    token = criar_token(usuario)

    return {
        "ok": True,
        "token": token,
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "nome": usuario["nome_completo"],
            "codigo": usuario["codigo"],
            "qrcode": usuario["qrcode"]
        }
    }

@router.post("/codigo")
def login_codigo(dados: dict):
    codigo = dados.get("codigo")

    usuario = executar_select("SELECT * FROM clientes WHERE codigo = %s", (codigo,))

    if not usuario:
        raise HTTPException(status_code=401, detail="Código inválido")

    usuario = usuario[0]

    token = criar_token(usuario)

    return {
        "ok": True,
        "token": token,
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "nome": usuario["nome_completo"],
            "codigo": usuario["codigo"],
            "qrcode": usuario["qrcode"]
        }
    }
@router.post("/qrcode")
def login_qrcode(dados: dict):
    qrcode = dados.get("qrcode")

    usuario = executar_select("SELECT * FROM clientes WHERE qrcode = %s", (qrcode,))

    if not usuario:
        raise HTTPException(status_code=401, detail="QR Code inválido")

    usuario = usuario[0]

    token = criar_token(usuario)

    return {
        "ok": True,
        "token": token,
        "usuario": {
            "id": usuario["id"],
            "email": usuario["email"],
            "nome": usuario["nome_completo"],
            "codigo": usuario["codigo"],
            "qrcode": usuario["qrcode"]
        }
    }
