from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import re

from passlib.context import CryptContext

from database import executar_comando, executar_select
from .auth_clientes import verificar_token_cliente

router = APIRouter()

# ===============================
# CRIPTOGRAFIA
# ===============================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ===============================
# SCHEMAS
# ===============================
class AlterarSenhaRequest(BaseModel):
    senha: str


class VerificarSenhaRequest(BaseModel):
    senha: str


# ===============================
# VALIDAR SENHA NOVA
# ===============================
def validar_senha(senha: str):
    if len(senha) < 8:
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter no mínimo 8 caracteres"
        )

    if not re.search(r"[A-Za-z]", senha):
        raise HTTPException(
            status_code=400,
            detail="A senha deve conter pelo menos uma letra"
        )

    if not re.search(r"[0-9]", senha):
        raise HTTPException(
            status_code=400,
            detail="A senha deve conter pelo menos um número"
        )


# ===============================
# VERIFICAR SENHA ATUAL
# ===============================
@router.post("/clientes/verificar-senha")
def verificar_senha(
    dados: VerificarSenhaRequest,
    usuario=Depends(verificar_token_cliente)
):
    resultado = executar_select(
        """
        SELECT senha
        FROM clientes
        WHERE id = %s
        """,
        (usuario["id"],)
    )

    if not resultado:
        return {"valida": False}

    senha_hash = resultado[0]["senha"]

    valida = pwd_context.verify(dados.senha, senha_hash)

    return {"valida": valida}


# ===============================
# ALTERAR SENHA
# ===============================
@router.put("/clientes/alterar-senha")
def alterar_senha(
    dados: AlterarSenhaRequest,
    usuario=Depends(verificar_token_cliente)
):
    senha = dados.senha.strip()

    validar_senha(senha)

    senha_hash = pwd_context.hash(senha)

    executar_comando(
        """
        UPDATE clientes
        SET senha = %s
        WHERE id = %s
        """,
        (senha_hash, usuario["id"])
    )

    return {"msg": "Senha alterada com sucesso"}
