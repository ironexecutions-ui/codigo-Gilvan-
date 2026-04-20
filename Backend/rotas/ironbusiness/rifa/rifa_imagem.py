from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io
import requests
from database import executar_select

router = APIRouter(prefix="/rifa", tags=["Rifa Story"])


def carregar_imagem(url: str, tamanho: tuple | None = None):
    try:
        r = requests.get(url, timeout=5)
        if r.status_code != 200:
            return None
        img = Image.open(io.BytesIO(r.content)).convert("RGBA")
        if tamanho:
            img.thumbnail(tamanho, Image.LANCZOS)
        return img
    except:
        return None


def imagem_circular(img: Image.Image, size: int):
    img = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    img.putalpha(mask)
    return img


@router.post("/{rifa_id}/gerar-story")
def gerar_story(rifa_id: int):

    r = executar_select(
        """
        SELECT
            r.nome,
            r.premio,
            r.numeros,
            r.data_fim,
            r.fotos,
            c.loja,
            c.imagem AS imagem_loja
        FROM rifa_registro r
        LEFT JOIN comercios_cadastradas c ON c.id = r.comercio_id
        WHERE r.id = %s
        """,
        (rifa_id,)
    )

    if not r:
        raise HTTPException(404, "Rifa não encontrada")

    rifa = r[0]

    vendidos = executar_select(
        """
        SELECT numeros
        FROM rifa_compras
        WHERE rifa_id = %s AND pago = 1
        """,
        (rifa_id,)
    )

    comprados = set()
    for v in vendidos:
        for n in v["numeros"].split("|"):
            comprados.add(int(n))

    inicio, fim = map(int, rifa["numeros"].split("-"))
    todos_numeros = list(range(inicio, fim + 1))

    # ===============================
    # FUNDO COM GRADIENTE
    # ===============================
    img = Image.new("RGB", (1080, 1920))
    draw = ImageDraw.Draw(img)

    for y in range(1920):
        cor = int(40 + (y / 1920) * 30)
        draw.line([(0, y), (1080, y)], fill=(30, 58, 138 + cor // 3))

    try:
        fonte_loja = ImageFont.truetype("arialbd.ttf", 92)
        fonte_texto = ImageFont.truetype("arial.ttf", 58)
        fonte_numero = ImageFont.truetype("arialbd.ttf", 40)
        fonte_data = ImageFont.truetype("arialbd.ttf", 52)
    except:
        fonte_loja = fonte_texto = fonte_numero = fonte_data = ImageFont.load_default()


    y = 40

    # ===============================
    # LOGO CIRCULAR
    # ===============================
    logo = carregar_imagem(rifa.get("imagem_loja"), (260, 260))
    if logo:
        logo = imagem_circular(logo, 200)

        fundo_logo = Image.new("RGBA", (220, 220), (255, 255, 255, 255))
        fundo_logo = imagem_circular(fundo_logo, 220)

        x_logo = (1080 - 220) // 2
        img.paste(fundo_logo, (x_logo, y), fundo_logo)
        img.paste(logo, (x_logo + 10, y + 10), logo)

        y += 240

    # ===============================
    # NOME DA LOJA
    # ===============================
    draw.text(
        (540, y),
        rifa["loja"],
        fill="white",
        font=fonte_loja,
        anchor="mm"
    )
    y += 90

    # ===============================
    # CARD DO PRÊMIO
    # ===============================
    card_top = y
    card_height = 420

    draw.rounded_rectangle(
        [60, card_top, 1020, card_top + card_height],
        radius=36,
        fill="#3b82f6"
    )

    y += 40

    fotos = (rifa.get("fotos") or "").split("|")
    imagens = []

    for f in fotos[:3]:
        img_p = carregar_imagem(f, (260, 200))
        if img_p:
            imagens.append(img_p)

    if imagens:
        total_w = sum(i.width for i in imagens) + (len(imagens) - 1) * 24
        x = (1080 - total_w) // 2

        for im in imagens:
            img.paste(im, (x, y), im)
            x += im.width + 24

        y += imagens[0].height + 80

    draw.text(
        (540, y),
        f"Prêmio: {rifa['premio']}",
        fill="white",
        font=fonte_texto,
        anchor="mm"
    )

    y += 70

    data = rifa["data_fim"].strftime("%d/%m/%Y")
    hora = rifa["data_fim"].strftime("%H:%M")
    texto_finaliza = f"Finaliza {data} às {hora}"

    draw.text(
        (540, y),
        texto_finaliza,
        fill="white",
        font=fonte_data,
        anchor="mm"
    )

    # ===============================
    # GRID DE NÚMEROS
    # ===============================
    y = card_top + card_height + 40

    tamanho = 56
    espaco = 14
    colunas = 10

    largura_grid = (colunas * tamanho) + ((colunas - 1) * espaco)
    x_start = (1080 - largura_grid) // 2

    col = row = 0

    for n in todos_numeros:
        x = x_start + col * (tamanho + espaco)
        y_n = y + row * (tamanho + espaco)

        if n in comprados:
            draw.rounded_rectangle(
                [x, y_n, x+tamanho, y_n+tamanho],
                radius=10,
                outline="#ef4444",
                width=2
            )
            draw.line(
                [x+6, y_n+tamanho-6, x+tamanho-6, y_n+6],
                fill="#ef4444",
                width=3
            )
            cor_texto = "#ef4444"
        else:
            draw.rounded_rectangle(
                [x, y_n, x+tamanho, y_n+tamanho],
                radius=10,
                outline="white",
                width=1
            )
            cor_texto = "white"

        draw.text(
            (x + tamanho/2, y_n + tamanho/2),
            str(n),
            fill=cor_texto,
            font=fonte_numero,
            anchor="mm"
        )

        col += 1
        if col >= colunas:
            col = 0
            row += 1

    # ===============================
    # SAÍDA PDF (ÚNICA ALTERAÇÃO)
    # ===============================
    buf = io.BytesIO()
    img.convert("RGB").save(
        buf,
        format="PDF",
        resolution=300.0
    )
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="rifa_{rifa_id}.pdf"'
        }
    )
