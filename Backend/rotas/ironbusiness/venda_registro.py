from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente
from fpdf import FPDF
from supabase import create_client, Client
import os
import tempfile

SUPABASE_URL = "https://mtljmvivztkgoolnnwxc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGptdml2enRrZ29vbG5ud3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQwMzM0MywiZXhwIjoyMDc4OTc5MzQzfQ.XFJVnYVbK-pxJ7oftduk680YsXltdUB06Yr_buIoJPA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(
    prefix="/caixa",
    tags=["Fechamento de Caixa"]
)

@router.post("/fechar")
def fechar_caixa(cliente=Depends(verificar_token_cliente)):

    usuario_id = cliente["id"]

    usuario = executar_select("""
        SELECT nome_completo
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (usuario_id,))

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    nome_usuario = usuario[0]["nome_completo"]

    ultimo = executar_select("""
        SELECT data, hora
        FROM vendas_registro
        WHERE usuario_id = %s
        ORDER BY id DESC
        LIMIT 1
    """, (usuario_id,))

    filtro_data = ""
    params = [usuario_id]

    if ultimo:
        filtro_data = "AND (data > %s OR (data = %s AND hora > %s))"
        params.extend([
            ultimo[0]["data"],
            ultimo[0]["data"],
            ultimo[0]["hora"]
        ])

    vendas = executar_select(f"""
        SELECT id, valor_pago, produtos
        FROM vendas_ib
        WHERE realizada = %s
        {filtro_data}
    """, params)

    if not vendas:
        raise HTTPException(status_code=400, detail="Nenhuma venda para fechar")

    ids_vendas = []
    total = 0

    for v in vendas:
        ids_vendas.append(str(v["id"]))
        total += float(v["valor_pago"])

    agora = datetime.now() - timedelta(hours=3)

    nome_arquivo = f"comanda_fechamento_{usuario_id}_{int(agora.timestamp())}.pdf"
    caminho_local = os.path.join(tempfile.gettempdir(), nome_arquivo)

    pdf = FPDF(orientation="P", unit="mm", format=(70, 320))
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=4)
    pdf.set_font("Courier", size=8)

    pdf.cell(0, 4, "FECHAMENTO DE CAIXA", ln=True, align="C")
    pdf.cell(0, 4, "-" * 32, ln=True)
    pdf.cell(0, 4, f"Operador: {nome_usuario}", ln=True)
    pdf.cell(0, 4, agora.strftime("%d/%m/%Y %H:%M:%S"), ln=True)
    pdf.cell(0, 4, "-" * 32, ln=True)

    for venda in vendas:
        if not venda["produtos"]:
            continue

        itens = venda["produtos"].split(",")

        for item in itens:
            item = item.strip()
            if not item or ":" not in item:
                continue

            prod_id, qtd = item.split(":", 1)
            if not prod_id.isdigit() or not qtd.isdigit():
                continue

            prod = executar_select("""
                SELECT nome, unidade, preco
                FROM produtos_servicos
                WHERE id = %s
            """, (int(prod_id),))

            if not prod:
                continue

            prod = prod[0]
            subtotal = float(prod["preco"]) * int(qtd)

            nome_prod = f"{prod['nome']} ({prod['unidade']})"
            pdf.cell(0, 4, f"{nome_prod[:26]} x{qtd}", ln=True)
            pdf.cell(0, 4, f"   R$ {subtotal:.2f}", ln=True, align="R")

        pdf.cell(0, 3, "-" * 32, ln=True)

    pdf.set_font("Courier", style="B", size=9)
    pdf.cell(0, 6, f"TOTAL R$ {total:.2f}", ln=True, align="C")
    pdf.set_font("Courier", size=8)
    pdf.cell(0, 4, "-" * 32, ln=True)

    pdf.cell(0, 4, "Comanda de fechamento", ln=True, align="C")
    pdf.cell(0, 4, "", ln=True, align="C")

    pdf.output(caminho_local)

    with open(caminho_local, "rb") as f:
        supabase.storage.from_("assinaturas").upload(
        f"comandas/{nome_arquivo}",
        f,
        {
            "content-type": "application/pdf",
            "upsert": "true"
        }
    )


    link_publico = (
        f"{SUPABASE_URL}/storage/v1/object/public/"
        f"assinaturas/comandas/{nome_arquivo}"
    )

    executar_comando("""
        INSERT INTO vendas_registro
        (usuario_id, vendas_id, link, total, data, hora)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        usuario_id,
        "|".join(ids_vendas),
        link_publico,
        total,
        agora.date(),
        agora.time().replace(microsecond=0)
    ))

    return {
        "status": "ok",
        "link": link_publico
    }
@router.get("/comandas")
def listar_comandas(cliente=Depends(verificar_token_cliente)):
    usuario_id = cliente["id"]

    registros = executar_select("""
        SELECT
            id,
            link,
            data,
            hora
        FROM vendas_registro
        WHERE usuario_id = %s
        ORDER BY id DESC
    """, (usuario_id,))

    for r in registros:
        # DATA
        if r.get("data"):
            r["data"] = r["data"].strftime("%d/%m/%Y")

        # HORA (vem como timedelta)
        if r.get("hora"):
            total_segundos = int(r["hora"].total_seconds())
            horas = total_segundos // 3600
            minutos = (total_segundos % 3600) // 60
            segundos = total_segundos % 60
            r["hora"] = f"{horas:02d}:{minutos:02d}:{segundos:02d}"

    return registros

@router.get("/fechamentos-empresa")
def listar_fechamentos_empresa(cliente=Depends(verificar_token_cliente)):

    # comércio do usuário logado
    comercio = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente["id"],))

    if not comercio or not comercio[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Usuário sem comércio vinculado")

    comercio_id = comercio[0]["comercio_id"]

    registros = executar_select("""
        SELECT
            vr.id,
            vr.link,
            vr.data,
            vr.hora,
            c.nome_completo
        FROM vendas_registro vr
        JOIN clientes c ON c.id = vr.usuario_id
        WHERE c.comercio_id = %s
        ORDER BY vr.id DESC
    """, (comercio_id,))

    # formatação
    for r in registros:
        if r.get("data"):
            r["data"] = r["data"].strftime("%d/%m/%Y")

        if r.get("hora"):
            total = int(r["hora"].total_seconds())
            h = total // 3600
            m = (total % 3600) // 60
            s = total % 60
            r["hora"] = f"{h:02d}:{m:02d}:{s:02d}"

    return registros
