from fastapi import APIRouter, Depends, HTTPException
from utils.crypto import criptografar, descriptografar
from database import executar_comando, executar_select
from .auth_clientes import verificar_token_cliente

router = APIRouter(prefix="/comercio/pix", tags=["Pix Caixa"])


# ===============================
# SALVAR CREDENCIAIS PIX
# ===============================
@router.post("/salvar")
def salvar_pix(dados: dict, usuario=Depends(verificar_token_cliente)):

    usuario_id = usuario["id"]

    r = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (usuario_id,))

    if not r or not r[0]["comercio_id"]:
        raise HTTPException(403, "Usuário sem comércio vinculado")

    comercio_id = r[0]["comercio_id"]

    gerar_pix = int(dados.get("gerar_pix", 0))
    public_key = dados.get("public_key")
    access_token = dados.get("access_token")

    executar_comando("""
        UPDATE comercios_cadastradas
        SET mercado = %s
        WHERE id = %s
    """, (gerar_pix, comercio_id))

    if gerar_pix == 0:
        return {"ok": True, "mercado": 0}

    if not public_key or not access_token:
        raise HTTPException(400, "Credenciais obrigatórias para Pix ativo")

    pk_enc = criptografar(public_key)
    at_enc = criptografar(access_token)

    executar_comando("""
        INSERT INTO pix_caixa (comercio_id, public_key, access_token)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
            public_key = VALUES(public_key),
            access_token = VALUES(access_token)
    """, (comercio_id, pk_enc, at_enc))

    return {"ok": True, "mercado": 1}

# ===============================
# VERIFICAR SE PIX ESTÁ ATIVO
# ===============================
@router.get("/ativo")
def pix_ativo(usuario=Depends(verificar_token_cliente)):

    usuario_id = usuario["id"]

    # 🔎 Buscar comércio do usuário
    r = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (usuario_id,))

    if not r or not r[0]["comercio_id"]:
        raise HTTPException(403, "Usuário sem comércio vinculado")

    comercio_id = r[0]["comercio_id"]

    # 🔎 Verificar se Pix Mercado Pago está ativo
    r = executar_select("""
        SELECT pc.public_key, pc.access_token, c.mercado
        FROM pix_caixa pc
        JOIN comercios_cadastradas c ON c.id = pc.comercio_id
        WHERE pc.comercio_id = %s
          AND c.mercado = 1
        LIMIT 1
    """, (comercio_id,))

    if not r:
        return {"ativo": False}

    return {
        "ativo": True,
        "public_key": descriptografar(r[0]["public_key"])
    }
