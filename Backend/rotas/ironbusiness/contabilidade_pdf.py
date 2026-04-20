from fastapi import APIRouter, Depends, HTTPException, Response
from database import executar_select
from .auth_clientes import verificar_token_cliente
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/admin/contabilidade/pdf",
    tags=["Admin - Contabilidade PDF"]
)

@router.get("/pdf")
def gerar_pdf_contabilidade(
    data_inicio: str,
    data_fim: str,
    cliente=Depends(verificar_token_cliente)
):

    # ===============================
    # VALIDAR COMÉRCIO
    # ===============================
    comercio = executar_select("""
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """, (cliente["id"],))

    if not comercio:
        raise HTTPException(403, "Usuário sem comércio vinculado")

    comercio_id = comercio[0]["comercio_id"]

    # ===============================
    # BUSCAR DADOS
    # ===============================
    registros = executar_select("""
        SELECT
            ps.nome AS produto,
            COALESCE(ps.unidade, ps.tempo_servico, ps.unidades, '-') AS unidade,
            h.quantos,
            h.data_hora
        FROM historico_soma h
        JOIN soma_produtos s ON s.id = h.soma_id
        JOIN produtos_servicos ps ON ps.id = s.produto_id
        WHERE s.comercio_id = %s
          AND h.data_hora BETWEEN %s AND %s
        ORDER BY h.data_hora ASC
    """, (
        comercio_id,
        f"{data_inicio} 00:00:00",
        f"{data_fim} 23:59:59"
    ))

    if not registros:
        raise HTTPException(404, "Nenhum registro encontrado no período")

    # ===============================
    # GERAR PDF
    # ===============================
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    largura, altura = A4

    margem_x = 40
    y = altura - 50

    # -------------------------------
    # CABEÇALHO
    # -------------------------------
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(margem_x, y, "Relatório de Contabilidade")
    y -= 22

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        margem_x,
        y,
        f"Período: {data_inicio} até {data_fim}"
    )
    y -= 15

    pdf.drawString(
        margem_x,
        y,
        f"Gerado em: {(datetime.now() - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')}"
    )
    y -= 20

    pdf.setLineWidth(1)
    pdf.line(margem_x, y, largura - margem_x, y)
    y -= 15

    # -------------------------------
    # CABEÇALHO DA TABELA
    # -------------------------------
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margem_x, y, "Produto")
    pdf.drawString(margem_x + 230, y, "Unidade")
    pdf.drawString(margem_x + 320, y, "Entradas")
    pdf.drawString(margem_x + 390, y, "Data / Hora")

    y -= 10
    pdf.line(margem_x, y, largura - margem_x, y)
    y -= 12

    pdf.setFont("Helvetica", 9)

    # -------------------------------
    # DADOS
    # -------------------------------
    for r in registros:

        if y < 60:
            pdf.showPage()
            y = altura - 50

            pdf.setFont("Helvetica-Bold", 9)
            pdf.drawString(margem_x, y, "Produto")
            pdf.drawString(margem_x + 230, y, "Unidade")
            pdf.drawString(margem_x + 320, y, "Entradas")
            pdf.drawString(margem_x + 390, y, "Data / Hora")
            y -= 10
            pdf.line(margem_x, y, largura - margem_x, y)
            y -= 12
            pdf.setFont("Helvetica", 9)

        pdf.drawString(
            margem_x,
            y,
            str(r["produto"])[:45]
        )

        pdf.drawString(
            margem_x + 230,
            y,
            str(r["unidade"])
        )

        pdf.drawRightString(
            margem_x + 360,
            y,
            str(r["quantos"])
        )

        pdf.drawString(
            margem_x + 390,
            y,
            r["data_hora"].strftime('%Y-%m-%d %H:%M:%S')
        )

        y -= 14

    # -------------------------------
    # FINALIZAÇÃO
    # -------------------------------
    pdf.save()
    buffer.seek(0)

    nome_arquivo = f"contabilidade_{data_inicio}_a_{data_fim}.pdf"

    return Response(
        buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={nome_arquivo}"
        }
    )
