from fastapi import APIRouter, Depends, HTTPException
from database import executar_select
from .auth_clientes import verificar_token_cliente

router = APIRouter()

@router.get("/fiscal/nfce")
def listar_nfce(usuario=Depends(verificar_token_cliente)):

    if "id" not in usuario:
        raise HTTPException(status_code=401, detail="Usuário inválido")

    # ===============================
    # BUSCAR COMÉRCIO DO USUÁRIO
    # ===============================
    cliente = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not cliente or not cliente[0]["comercio_id"]:
        raise HTTPException(
            status_code=400,
            detail="Usuário sem comércio vinculado"
        )

    comercio_id = cliente[0]["comercio_id"]

    # ===============================
    # BUSCAR NFC-e EMITIDAS
    # ===============================
    cupons = executar_select(
        """
        SELECT
            id,
            numero_nfce,
            serie,
            status,
            ambiente,
            criado_em
        FROM nfce_emitidas
        WHERE comercio_id = %s
        ORDER BY criado_em DESC
        """,
        (comercio_id,)
    )

    return cupons
