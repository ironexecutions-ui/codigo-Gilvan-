from fastapi import APIRouter, HTTPException
from database import executar_select, executar_comando

router = APIRouter(
    prefix="/admin/autorizacao",
    tags=["Admin - Autorização de Módulos"]
)

# =========================
# LISTAR POR STATUS
# =========================

@router.get("/{status}")
def listar(status: str):
    if status not in ("pendentes", "autorizados"):
        raise HTTPException(status_code=400, detail="Status inválido")

    ativo = 0 if status == "pendentes" else 1

    return executar_select("""
        SELECT 
            mc.comercio_cadastrado_id,
            DATE(mc.criado_em) AS data_solicitacao,
            GROUP_CONCAT(mc.modulo ORDER BY mc.modulo SEPARATOR ', ') AS modulos,
            cc.loja,
            cc.imagem,
            cc.celular
        FROM modulos_comercio mc
        JOIN comercios_cadastradas cc
            ON cc.id = mc.comercio_cadastrado_id
        WHERE mc.ativo = %s
        GROUP BY mc.comercio_cadastrado_id, DATE(mc.criado_em)
        ORDER BY data_solicitacao DESC
    """, (ativo,))


# =========================
# AUTORIZAR
# =========================
@router.put("/autorizar")
def autorizar(comercio_id: int, data: str):
    executar_comando("""
        UPDATE modulos_comercio
        SET ativo = 1
        WHERE comercio_cadastrado_id = %s
        AND DATE(criado_em) = %s
    """, (comercio_id, data))

    return {"ok": True}


# =========================
# NEGAR
# =========================
@router.delete("/negar")
def negar(comercio_id: int, data: str):
    executar_comando("""
        DELETE FROM modulos_comercio
        WHERE comercio_cadastrado_id = %s
        AND DATE(criado_em) = %s
    """, (comercio_id, data))

    return {"ok": True}
