from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import os

def gerar_pdf_compra(compra, rifa, comercio):
    pasta = "pdfs"
    os.makedirs(pasta, exist_ok=True)

    nome_arquivo = f"compra_rifa_{compra['id']}.pdf"
    caminho = os.path.join(pasta, nome_arquivo)

    c = canvas.Canvas(caminho, pagesize=A4)
    largura, altura = A4

    y = altura - 40

    def linha(texto):
        nonlocal y
        c.drawString(40, y, texto)
        y -= 20

    c.setFont("Helvetica-Bold", 16)
    linha("COMPROVANTE DE COMPRA - RIFA")

    y -= 10
    c.setFont("Helvetica", 12)

    linha(f"Loja: {comercio['loja']}")
    linha(f"Email da loja: {comercio['email']}")
    linha(f"Contato: {comercio['celular']}")

    y -= 10
    linha(f"Rifa: {rifa['nome']}")
    linha(f"Prêmio: {rifa['premio']}")
    linha(f"Preço por número: R$ {rifa['preco']}")

    y -= 10
    linha(f"Compra ID: {compra['id']}")
    linha(f"Nome: {compra['nome']}")
    linha(f"Email: {compra['email']}")
    linha(f"WhatsApp: {compra['whatsapp']}")
    linha(f"Números comprados: {compra['numeros'].replace('|', ', ')}")

    quantidade = len(compra["numeros"].split("|"))
    total = quantidade * float(rifa["preco"])

    linha(f"Quantidade: {quantidade}")
    linha(f"Total pago: R$ {total:.2f}")

    y -= 10
    linha(f"Data do pagamento: {datetime.now().strftime('%d/%m/%Y %H:%M')}")

    c.showPage()
    c.save()

    return nome_arquivo
