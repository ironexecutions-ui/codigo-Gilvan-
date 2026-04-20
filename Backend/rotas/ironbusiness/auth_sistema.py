from fastapi import Request, HTTPException
import jwt

CHAVE = "ironexecutions_super_secreto_2025"

async def verificar_token_sistema(request: Request):

    auth_header = request.headers.get("authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Não autorizado")

    try:
        tipo, token = auth_header.split()

        if tipo.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Não autorizado")

        payload = jwt.decode(token, CHAVE, algorithms=["HS256"])

        # 🔐 REGRA DO TOKEN DE SISTEMA
        if payload.get("tipo") != "sistema":
            raise HTTPException(status_code=401, detail="Token inválido")

        if payload.get("nome") != "pdv-local":
            raise HTTPException(status_code=401, detail="Token inválido")

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")

    except Exception:
        raise HTTPException(status_code=401, detail="Não autorizado")
