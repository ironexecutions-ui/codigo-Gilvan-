from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

from barcode import Code128
from barcode.writer import ImageWriter
import qrcode
import uuid
import os
from fpdf import FPDF
import tempfile

router = APIRouter(prefix="/controle", tags=["Controle"])

def exigir_admin(usuario: dict):
    funcao = (usuario.get("funcao") or "").lower()
    if "administrador" not in funcao:
        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )

# ===============================
# LISTAR CLIENTES DO COMÉRCIO
# ===============================
@router.get("/clientes")
def listar_clientes(usuario=Depends(verificar_token_cliente)):

    exigir_admin(usuario)

    linha = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not linha or not linha[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Usuário sem comércio associado")

    comercio_id = linha[0]["comercio_id"]

    def buscar(funcao):
        return executar_select(
            """
            SELECT id, email, nome_completo, cargo, matricula, codigo, qrcode
            FROM clientes
            WHERE funcao = %s
              AND comercio_id = %s
            """,
            (funcao, comercio_id)
        )

    return {
        "administradores": buscar("Administrador(a)"),
        "supervisores": buscar("Supervisor(a)"),
        "funcionarios": buscar("Funcionario(a)")
    }

# ===============================
# ATUALIZAR CLIENTE (SEGURO)
# ===============================
@router.put("/clientes/{id}")
def atualizar_cliente(
    id: int,
    dados: dict,
    usuario=Depends(verificar_token_cliente)
):

    exigir_admin(usuario)

    admin = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    alvo = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (id,)
    )

    if not admin or not alvo or admin[0]["comercio_id"] != alvo[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Cliente fora do seu comércio")

    executar_comando(
        """
        UPDATE clientes
        SET email=%s, nome_completo=%s, cargo=%s, matricula=%s
        WHERE id=%s
        """,
        (
            dados["email"],
            dados["nome_completo"],
            dados["cargo"],
            dados["matricula"],
            id
        )
    )

    return {"ok": True}

# ===============================
# GERAR PDF (SEGURO)
# ===============================
@router.get("/clientes/{id}/pdf/{tipo}")
def gerar_pdf(
    id: int,
    tipo: str,
    usuario=Depends(verificar_token_cliente)
):

    exigir_admin(usuario)

    admin = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    cliente = executar_select(
        """
        SELECT nome_completo, codigo, qrcode, comercio_id
        FROM clientes
        WHERE id = %s
        """,
        (id,)
    )

    if not admin or not cliente or admin[0]["comercio_id"] != cliente[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    cliente = cliente[0]

    tmp_dir = tempfile.mkdtemp()
    pdf_path = os.path.join(tmp_dir, f"{uuid.uuid4()}.pdf")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)

    pdf.cell(0, 10, cliente["nome_completo"], ln=True)

    # ===== BARCODE =====
    if tipo == "codigo":
        valor_codigo = str(cliente["codigo"]).strip()

        writer = ImageWriter()
        barcode_path = os.path.join(tmp_dir, "barcode")

        Code128(valor_codigo, writer=writer).save(
            barcode_path,
            options={"write_text": False}
        )

        pdf.image(barcode_path + ".png", x=30, y=40, w=120)

    # ===== QR CODE =====
    elif tipo == "qrcode":
        qr_img = qrcode.make(cliente["qrcode"])
        qr_path = os.path.join(tmp_dir, "qrcode.png")
        qr_img.save(qr_path)

        pdf.image(qr_path, x=70, y=40, w=60)

    else:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    pdf.output(pdf_path)

    nome_arquivo = "codigo_barras.pdf" if tipo == "codigo" else "qr_code.pdf"

    return FileResponse(
        pdf_path,
        filename=nome_arquivo,
        media_type="application/pdf"
    )

# ===============================
# CRIAR CLIENTE (SEGURO)
# ===============================
@router.post("/clientes")
def criar_cliente(
    dados: dict,
    usuario=Depends(verificar_token_cliente)
):

    exigir_admin(usuario)

    admin = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    if not admin or not admin[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Admin sem comércio")

    comercio_id = admin[0]["comercio_id"]

    executar_comando(
        """
        INSERT INTO clientes
        (email, nome_completo, cargo, matricula, funcao, comercio_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            dados["email"],
            dados["nome_completo"],
            dados["cargo"],
            dados["matricula"],
            "Funcionario(a)",
            comercio_id
        )
    )

    return {"ok": True}

# ===============================
# APAGAR CLIENTE (SEGURO)
# ===============================
@router.delete("/clientes/{id}")
def apagar_cliente(
    id: int,
    usuario=Depends(verificar_token_cliente)
):

    exigir_admin(usuario)

    if usuario["id"] == id:
        raise HTTPException(
            status_code=400,
            detail="Você não pode apagar sua própria conta"
        )

    admin = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (usuario["id"],)
    )

    alvo = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (id,)
    )

    if not admin or not alvo or admin[0]["comercio_id"] != alvo[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Cliente fora do seu comércio")

    executar_comando(
        "DELETE FROM clientes WHERE id = %s",
        (id,)
    )

    return {"ok": True}
