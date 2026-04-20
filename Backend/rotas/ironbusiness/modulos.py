from fastapi import APIRouter, Depends, HTTPException
from database import conectar
from .auth_clientes import verificar_token_cliente

router = APIRouter()

# ===============================
# EXIGIR ADMINISTRADOR
# ===============================
def exigir_admin(cliente=Depends(verificar_token_cliente)):
    if cliente.get("funcao") != "Administrador(a)":
        raise HTTPException(
            status_code=403,
            detail="Acesso não autorizado"
        )
    return cliente

# ===============================
# MÓDULOS DO COMÉRCIO
# ===============================
@router.get("/modulos/empresa/{comercio_id}")
def listar_modulos_empresa(
    comercio_id: int,
    admin=Depends(exigir_admin)
):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            m.modulo,
            m.descricao,
            mc.ativo
        FROM modulos m
        LEFT JOIN modulos_comercio mc
            ON mc.modulo = m.modulo
            AND mc.comercio_cadastrado_id = %s
        WHERE m.ativo = 1
        ORDER BY m.id ASC
    """, (comercio_id,))

    lista = cursor.fetchall()

    cursor.close()
    conn.close()

    return lista

# ===============================
# MÓDULOS ATIVOS NO SISTEMA
# ===============================
@router.get("/modulos/ativos")
def listar_modulos_ativos(admin=Depends(exigir_admin)):
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT modulo, descricao 
        FROM modulos
        WHERE ativo = 1
    """)

    lista = cursor.fetchall()

    cursor.close()
    conn.close()
    return lista

# ===============================
# SOLICITAR MÓDULO
# ===============================
@router.put("/modulos/solicitar")
def solicitar_modulo(
    body: dict,
    admin=Depends(exigir_admin)
):
    comercio_id = body.get("comercio_id")
    modulo = body.get("modulo")

    if not comercio_id or not modulo:
        raise HTTPException(400, "Dados incompletos")

    conn = conectar()
    cursor = conn.cursor()

    # verifica se o módulo existe e está ativo
    cursor.execute("""
        SELECT 1 FROM modulos
        WHERE modulo = %s AND ativo = 1
    """, (modulo,))

    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(404, "Módulo inexistente ou desativado")

    # evita duplicação
    cursor.execute("""
        SELECT 1 FROM modulos_comercio
        WHERE comercio_cadastrado_id = %s
        AND modulo = %s
    """, (comercio_id, modulo))

    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(400, "Módulo já solicitado ou ativo")

    cursor.execute("""
        INSERT INTO modulos_comercio
        (comercio_cadastrado_id, modulo, ativo)
        VALUES (%s, %s, 0)
    """, (comercio_id, modulo))

    conn.commit()
    cursor.close()
    conn.close()

    return { "mensagem": "Módulo solicitado com sucesso" }
