from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import date, timedelta
from database import executar_select
from .auth_clientes import verificar_token_cliente
from fastapi.responses import FileResponse
from fpdf import FPDF
import uuid
import calendar
import tempfile
import os

router = APIRouter(
    prefix="/admin/graficos",
    tags=["Admin - Gráficos"]
)

# =========================================================
# FUNÇÃO ABSOLUTA – VALIDAÇÃO DE PREÇO
# =========================================================
def preco_valido(produto):
    try:
        preco = produto["preco"]
        if preco is None:
            return False
        return float(preco) > 0.00
    except Exception:
        return False

def custo_valido(produto):
    try:
        custo = produto["preco_recebido"]
        if custo is None:
            return False
        return float(custo) > 0.00
    except Exception:
        return False


# =========================================================
# FUNÇÃO – CHAVE DO GRÁFICO
# =========================================================
def chave_periodo(data: date, periodo: str):
    if periodo == "dias":
        return data.strftime("%Y-%m-%d")

    if periodo == "semanas":
        ano, semana, _ = data.isocalendar()
        return f"{ano}-W{semana}"

    if periodo == "quincenas":
        q = 1 if data.day <= 15 else 2
        return f"{data.year}-{data.month:02d}-Q{q}"

    if periodo == "meses":
        return f"{data.year}-{data.month:02d}"

    return None


# =========================================================
# FUNÇÃO – INTERVALO REAL PELO LABEL
# =========================================================
def intervalo_por_label(label: str, periodo: str):
    if periodo == "dias":
        d = date.fromisoformat(label)
        return d, d

    if periodo == "semanas":
        ano, semana = label.split("-W")
        inicio = date.fromisocalendar(int(ano), int(semana), 1)
        return inicio, inicio + timedelta(days=6)

    if periodo == "quincenas":
        ano, mes, q = label.split("-")
        mes = int(mes)
        q = int(q.replace("Q", ""))

        if q == 1:
            return date(int(ano), mes, 1), date(int(ano), mes, 15)

        ultimo = calendar.monthrange(int(ano), mes)[1]
        return date(int(ano), mes, 16), date(int(ano), mes, ultimo)

    if periodo == "meses":
        ano, mes = label.split("-")
        ultimo = calendar.monthrange(int(ano), int(mes))[1]
        return date(int(ano), int(mes), 1), date(int(ano), int(mes), ultimo)

    raise HTTPException(400, "Período inválido")


# =========================================================
# GRÁFICO DE GANHOS
# =========================================================
@router.get("/ganhos")
def grafico_ganhos(
    periodo: str = Query("dias"),
    cliente=Depends(verificar_token_cliente)
):
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )

    if not comercio:
        return {"dados": [], "sem_preco": 0}

    comercio_id = comercio[0]["comercio_id"]

    # ===============================
    # ALERTA REAL (INDEPENDENTE DE VENDAS)
    # ===============================
    sem_preco = executar_select(
        """
        SELECT COUNT(*) AS total
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND (preco IS NULL OR preco <= 0)
        """,
        (comercio_id,)
    )[0]["total"]
# ===============================
# ALERTA DE CUSTO ZERO
# ===============================
    sem_custo = executar_select(
    """
    SELECT COUNT(*) AS total
    FROM produtos_servicos
    WHERE comercio_id = %s
      AND (preco_recebido IS NULL OR preco_recebido <= 0)
    """,
    (comercio_id,)
    )[0]["total"]

    # ===============================
    # VENDAS
    # ===============================
    vendas = executar_select(
        """
        SELECT data, produtos
        FROM vendas_ib
        WHERE empresa = %s
        """,
        (comercio_id,)
    )

    mapa = {}

    for v in vendas:
        if not v["produtos"]:
            continue

        for item in v["produtos"].split(","):
            if ":" not in item:
                continue

            pid, qtd = item.split(":")
            try:
                qtd = int(qtd)
            except ValueError:
                continue

            produto = executar_select(
                """
                SELECT preco, preco_recebido
                FROM produtos_servicos
                WHERE id = %s
                """,
                (pid,)
            )

            if not produto:
                continue

            produto = produto[0]

        # 🔴 REGRA ABSOLUTA
            if not preco_valido(produto):
                    continue

            if not custo_valido(produto):
                 continue

# garantia extra de lucro positivo
            if produto["preco"] <= produto["preco_recebido"]:
                    continue

            ganho = (produto["preco"] - produto["preco_recebido"]) * qtd

            chave = chave_periodo(v["data"], periodo)
            if not chave:
                continue

            mapa[chave] = mapa.get(chave, 0) + ganho

    dados = [
        {"label": k, "ganho": round(v, 2)}
        for k, v in sorted(mapa.items(), reverse=True)[:10]
    ]

    return {
    "dados": list(reversed(dados)),
    "sem_preco": sem_preco,
    "sem_custo": sem_custo
}
# =========================================================
# DETALHES DO PERÍODO
# =========================================================
@router.get("/ganhos/detalhes")
def ganhos_detalhes(
    label: str,
    periodo: str,
    cliente=Depends(verificar_token_cliente)
):
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )
    if not comercio:
        return []

    inicio, fim = intervalo_por_label(label, periodo)
    comercio_id = comercio[0]["comercio_id"]

    vendas = executar_select(
        """
        SELECT v.data, v.produtos, c.nome_completo
        FROM vendas_ib v
        JOIN clientes c ON c.id = v.realizada
        WHERE v.empresa = %s
          AND v.data BETWEEN %s AND %s
        ORDER BY v.data
        """,
        (comercio_id, inicio, fim)
    )

    detalhes = []

    for v in vendas:
        for item in v["produtos"].split(","):
            if ":" not in item:
                continue

            pid, qtd = item.split(":")
            qtd = int(qtd)

            produto = executar_select(
                "SELECT nome, preco, preco_recebido FROM produtos_servicos WHERE id = %s",
                (pid,)
            )
            if not produto:
                continue

            produto = produto[0]

                    # 🔴 REGRA ABSOLUTA
            if not preco_valido(produto):
                       continue

            if not custo_valido(produto):
                 continue

            if produto["preco"] <= produto["preco_recebido"]:
                    continue



            detalhes.append({
                "data": v["data"],
                "produto": produto["nome"],
                "quantidade": qtd,
                "vendedor": v["nome_completo"],
                "preco_venda": produto["preco"],
                "custo": produto["preco_recebido"],
                "ganho": round((produto["preco"] - produto["preco_recebido"]) * qtd, 2)
            })

    return detalhes


# =========================================================
# PDF DE GANHOS
# =========================================================
@router.get("/ganhos/pdf")
def ganhos_pdf(
    label: str,
    periodo: str,
    cliente=Depends(verificar_token_cliente)
):
    dados = ganhos_detalhes(label, periodo, cliente)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    pdf.cell(0, 8, f"Relatorio de Ganhos - {label}", ln=True)
    pdf.ln(4)

    largura = pdf.w - pdf.l_margin - pdf.r_margin

    for d in dados:
        pdf.set_x(pdf.l_margin)

        texto = (
            f"Data: {d['data']} | "
            f"Produto: {d['produto']} | "
            f"Qtd: {d['quantidade']} | "
            f"Vendedor: {d['vendedor']} | "
            f"Venda: R$ {d['preco_venda']:.2f} | "
            f"Custo: R$ {d['custo']:.2f} | "
            f"Ganho: R$ {d['ganho']:.2f}"
        )

        pdf.multi_cell(largura, 6, texto)
        pdf.ln(2)

    nome = f"ganhos_{uuid.uuid4()}.pdf"
    caminho = os.path.join(tempfile.gettempdir(), nome)

    pdf.output(caminho)

    return FileResponse(
        caminho,
        filename=nome,
        media_type="application/pdf"
    )


# =========================================================
# PDF – PRODUTOS SEM PREÇO
# =========================================================
@router.get("/ganhos/pdf-sem-custo")
def pdf_sem_custo(cliente=Depends(verificar_token_cliente)):
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )

    if not comercio:
        raise HTTPException(403, "Comércio não encontrado")

    comercio_id = comercio[0]["comercio_id"]

    produtos = executar_select(
        """
        SELECT nome
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND (preco_recebido IS NULL OR preco_recebido <= 0)
        ORDER BY nome
        """,
        (comercio_id,)
    )

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", "B", 12)

    pdf.cell(0, 8, "Produtos com custo zerado", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", size=10)

    largura = pdf.w - pdf.l_margin - pdf.r_margin

    if not produtos:
        pdf.cell(0, 6, "Nenhum produto encontrado.", ln=True)
    else:
        for i, p in enumerate(produtos, start=1):
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(largura, 6, f"{i}. {p['nome']}")
            pdf.ln(1)

    pdf.ln(4)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 6, f"Total de produtos: {len(produtos)}", ln=True)

    nome = f"produtos_sem_custo_{uuid.uuid4()}.pdf"
    caminho = os.path.join(tempfile.gettempdir(), nome)

    pdf.output(caminho)

    return FileResponse(
        caminho,
        filename=nome,
        media_type="application/pdf"
    )

# =========================================================
# PDF – PRODUTOS COM CUSTO ZERADO
# =========================================================
@router.get("/ganhos/pdf-sem-custo")
def pdf_sem_custo(cliente=Depends(verificar_token_cliente)):
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )

    if not comercio:
        raise HTTPException(403, "Comércio não encontrado")

    comercio_id = comercio[0]["comercio_id"]

    produtos = executar_select(
        """
        SELECT nome
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND (preco_recebido IS NULL OR preco_recebido <= 0)
        ORDER BY nome
        """,
        (comercio_id,)
    )

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    pdf.cell(0, 8, "Produtos com custo zerado", ln=True)
    pdf.ln(4)

    if not produtos:
        pdf.cell(0, 6, "Nenhum produto encontrado.", ln=True)
    else:
        for p in produtos:
            largura = pdf.w - pdf.l_margin - pdf.r_margin
            pdf.multi_cell(largura, 6, f"- {p['nome']}")

        nome = f"produtos_sem_custo_{uuid.uuid4()}.pdf"

    tmp = tempfile.gettempdir()
    caminho = os.path.join(tmp, nome)

    pdf.output(caminho)

    return FileResponse(
    caminho,
    filename=nome,
    media_type="application/pdf"
)

@router.get("/ganhos/pdf-sem-preco")
def pdf_sem_preco(cliente=Depends(verificar_token_cliente)):
    comercio = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )

    if not comercio:
        raise HTTPException(403, "Comércio não encontrado")

    comercio_id = comercio[0]["comercio_id"]

    produtos = executar_select(
        """
        SELECT nome
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND (preco IS NULL OR preco <= 0)
        ORDER BY nome
        """,
        (comercio_id,)
    )

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", "B", 12)

    pdf.cell(0, 8, "Produtos sem preço cadastrado", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", size=10)

    largura = pdf.w - pdf.l_margin - pdf.r_margin

    if not produtos:
        pdf.cell(0, 6, "Nenhum produto encontrado.", ln=True)
    else:
        for i, p in enumerate(produtos, start=1):
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(largura, 6, f"{i}. {p['nome']}")
            pdf.ln(1)

    pdf.ln(4)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 6, f"Total de produtos: {len(produtos)}", ln=True)

    nome = f"produtos_sem_preco_{uuid.uuid4()}.pdf"
    caminho = os.path.join(tempfile.gettempdir(), nome)

    pdf.output(caminho)

    return FileResponse(
        caminho,
        filename=nome,
        media_type="application/pdf"
    )
