from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from database import conectar
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import os
from datetime import datetime

router = APIRouter()

# Pasta onde os PDFs serão salvos
PASTA_PDFS = "pdfs_contratos"
os.makedirs(PASTA_PDFS, exist_ok=True)


# ==============================================================
# GERAR PDF DO CONTRATO A PARTIR DO CÓDIGO
# ==============================================================
@router.get("/contratos/gerar-pdf/{codigo}")
def gerar_pdf_contrato(codigo: str):

    # ---------------------------------------
    # Buscar contrato pelo código
    # ---------------------------------------
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM contratos WHERE codigo = %s", (codigo,))
    contrato = cursor.fetchone()

    cursor.close()
    conn.close()

    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    # ---------------------------------------
    # Nome do arquivo PDF
    # ---------------------------------------
    caminho_pdf = f"{PASTA_PDFS}/contrato_{codigo}.pdf"

    # ---------------------------------------
    # Criar PDF
    # ---------------------------------------
    c = canvas.Canvas(caminho_pdf, pagesize=A4)
    largura, altura = A4

    # Margens
    margem_esq = 25 * mm
    margem_topo = altura - 25 * mm

    y = margem_topo
    texto = c.beginText(margem_esq, y)
    texto.setFont("Helvetica", 11)

    # ---------------------------------------
    # CONTEÚDO DO PDF — ORGANIZADO
    # ---------------------------------------

    def pula_linha(qtd=1):
        for _ in range(qtd):
            texto.textLine("")

    texto.setFont("Helvetica-Bold", 14)
    texto.textLine("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DE SITE")
    pula_linha(2)

    texto.setFont("Helvetica", 11)
    texto.textLine(f"Código interno: {contrato['codigo']}")
    texto.textLine(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 1 — IDENTIFICAÇÃO DAS PARTES
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 1 — IDENTIFICAÇÃO DAS PARTES")
    pula_linha()

    texto.setFont("Helvetica-Bold", 11)
    texto.textLine("CONTRATADA")
    texto.setFont("Helvetica", 11)
    texto.textLine("Iron Executions")
    texto.textLine(f"Responsável: {contrato['representante_nome']}")
    texto.textLine(f"Contato: {contrato['telefone_empresa']}")
    texto.textLine(f"E-mail: {contrato['email_empresa']}")
    pula_linha()

    texto.setFont("Helvetica-Bold", 11)
    texto.textLine("CONTRATANTE")
    texto.setFont("Helvetica", 11)
    texto.textLine(f"{contrato['nome_cliente']}")
    texto.textLine(f"Negócio: {contrato['negocio_cliente']}")
    texto.textLine(f"Documento: {contrato['documento_cliente']}")
    texto.textLine(f"Endereço: {contrato['endereco_cliente']}")
    texto.textLine(f"Contato: {contrato['telefone_cliente']}")
    texto.textLine(f"E-mail: {contrato['email_cliente']}")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 2 — OBJETO
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 2 — OBJETO DO CONTRATO")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine("O contrato tem por objeto o desenvolvimento de um site conforme as especificações abaixo.")
    pula_linha()

    texto.textLine(f"Tipo de site: {contrato['tipo_site']}")
    texto.textLine(f"Tecnologias utilizadas: {contrato['tecnologias']}")
    texto.textLine(f"Quantidade de páginas: {contrato['quantidade_paginas']}")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 3 — ESCOPO E LIMITAÇÕES
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 3 — ESCOPO E LIMITAÇÕES")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine("O escopo inclui somente os itens listados abaixo. Itens não listados requerem novo orçamento.")
    texto.textLine(f"Integrações previstas: {contrato['integracoes']}")
    texto.textLine(f"Revisões inclusas: {contrato['numero_revisoes']}")
    texto.textLine(f"Atualizações inclusas: {contrato['atualizacoes_inclusas']}")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 4 — PRAZO
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 4 — PRAZO DE ENTREGA")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine(
        f"O prazo estimado é de {contrato['prazo_entrega']} dias úteis. "
        "Sábados contam normalmente, apenas domingos ficam fora da contagem."
    )
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 5 — VALORES
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 5 — VALORES E PAGAMENTO")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine(f"Valor total: R$ {contrato['valor_total']}")
    texto.textLine(f"Forma de pagamento: {contrato['forma_pagamento']}")
    texto.textLine(f"Entrada: R$ {contrato['valor_entrada']}")
    texto.textLine(f"Valor final na entrega: R$ {contrato['valor_final_entrega']}")
    texto.textLine(f"Valor por revisão extra: R$ {contrato['valor_revisao_extra']}")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 6 — HOSPEDAGEM
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 6 — HOSPEDAGEM E SUPORTE")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine(f"Hospedagem inclusa: {contrato['hospedagem_inclusa']}")
    texto.textLine(f"Valor da hospedagem: {contrato['valor_hospedagem']}")
    texto.textLine(f"Dias de suporte: {contrato['dias_suporte']} dias")
    pula_linha(2)

    # ------------------------------------------------
    # CLÁUSULA 7 — FORO
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 7 — FORO")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine(
        f"Fica eleito o foro da cidade de {contrato['cidade_foro']} para resolução de conflitos."
    )
    pula_linha(2)

    # ------------------------------------------------
    # ASSINATURAS
    # ------------------------------------------------
    texto.setFont("Helvetica-Bold", 12)
    texto.textLine("CLÁUSULA 8 — ASSINATURAS")
    pula_linha()

    texto.setFont("Helvetica", 11)
    texto.textLine(f"Contratada: {contrato['representante_nome']}")
    texto.textLine(f"Data: {contrato['data_assinatura_contratada']}")
    pula_linha()

    texto.textLine(f"Contratante: {contrato['nome_cliente']}")
    texto.textLine(f"Data: {contrato['data_assinatura_cliente']}")
    pula_linha(2)

    texto.textLine("Documento gerado automaticamente pelo sistema Iron Executions.")

    c.drawText(texto)
    c.showPage()
    c.save()

    # ---------------------------------------
    # Retornar PDF
    # ---------------------------------------
    return FileResponse(
        caminho_pdf,
        media_type="application/pdf",
        filename=f"Contrato_{codigo}.pdf"
    )
