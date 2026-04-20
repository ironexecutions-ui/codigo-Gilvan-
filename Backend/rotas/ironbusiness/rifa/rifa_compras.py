from fastapi import APIRouter, HTTPException
from database import executar_select, executar_insert
import mercadopago
import os
from fastapi.responses import FileResponse
from .pdf_rifa import gerar_pdf_compra

# ===============================
# ROUTER
# ===============================
router = APIRouter(
    prefix="/rifa",
    tags=["Rifa Compras"]
)

# ===============================
# MERCADO PAGO
# ===============================
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN") or "APP_USR-5838609376524493-091213-21d8d5e8bfa53d25c1e4e36b05cb6299-2665206466"
sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

# ===============================
# BUSCAR RIFA PELO ID
# ===============================

@router.get("/{rifa_id}")
def buscar_rifa(rifa_id: int):

    sql = """
        SELECT 
            r.id,
            r.nome,
            r.fotos,
            r.numeros,
            r.preco,
            r.premio,
            r.comercio_id,
            r.data_fim,

            c.loja AS comercio_loja,
            c.imagem AS comercio_imagem,
            c.email AS comercio_email,
            c.celular AS comercio_celular

        FROM rifa_registro r
        LEFT JOIN comercios_cadastradas c
            ON c.id = r.comercio_id
        WHERE r.id = %s
        LIMIT 1
    """


    res = executar_select(sql, (rifa_id,))
    if not res:
        raise HTTPException(404, "Rifa não encontrada")

    rifa = res[0]

    rifa["fotos"] = rifa["fotos"].split("|") if rifa["fotos"] else []

    rifa["comercio"] = {
        "loja": rifa.pop("comercio_loja"),
        "imagem": rifa.pop("comercio_imagem"),
        "email": rifa.pop("comercio_email"),
        "celular": rifa.pop("comercio_celular")
    }

    return rifa


# ===============================
# NÚMEROS JÁ COMPRADOS
# ===============================
@router.get("/{rifa_id}/comprados")
def numeros_comprados(rifa_id: int):

    sql = """
        SELECT numeros
        FROM rifa_compras
        WHERE rifa_id = %s
          AND pago = 1
    """

    res = executar_select(sql, (rifa_id,))
    comprados = set()

    for row in res:
        for n in row["numeros"].split("|"):
            comprados.add(int(n))

    return sorted(list(comprados))


# ===============================
# CRIAR COMPRA (SEM PAGAMENTO AINDA)
# ===============================
from datetime import datetime, timezone, timedelta
@router.post("/{rifa_id}/comprar")
def comprar(rifa_id: int, data: dict):

    numeros = set(data.get("numeros", []))
    nome = data.get("nome")
    whatsapp = data.get("whatsapp")
    email = data.get("email")
    mensagem = data.get("mensagem", "")

    if not numeros or not nome or not whatsapp or not email:
        raise HTTPException(400, "Dados inválidos")

    # ===============================
    # BUSCAR RIFA (PREÇO + DATA FIM)
    # ===============================
    rifa = executar_select(
        """
        SELECT preco, data_fim
        FROM rifa_registro
        WHERE id = %s
        """,
        (rifa_id,)
    )

    if not rifa:
        raise HTTPException(404, "Rifa não encontrada")

    preco = float(rifa[0]["preco"])
    data_fim = rifa[0]["data_fim"]

    # ===============================
    # BLOQUEAR SE RIFA FINALIZADA
    # ===============================
    if data_fim:
        try:
            fim = datetime.strptime(str(data_fim), "%Y-%m-%d %H:%M:%S")
            fim = fim.replace(tzinfo=timezone(timedelta(hours=-3)))
            agora = datetime.now(timezone(timedelta(hours=-3)))

            if agora >= fim:
                raise HTTPException(
                    403,
                    "Esta rifa já foi finalizada e não aceita novas compras"
                )
        except ValueError:
            pass

    # ===============================
    # VERIFICAR CONCORRÊNCIA
    # ===============================
    vendidos = set()
    vendidos_sql = """
        SELECT numeros
        FROM rifa_compras
        WHERE rifa_id = %s
          AND pago = 1
    """

    res_vendidos = executar_select(vendidos_sql, (rifa_id,))
    for row in res_vendidos:
        for n in row["numeros"].split("|"):
            vendidos.add(int(n))

    conflito = numeros & vendidos
    if conflito:
        raise HTTPException(
            409,
            {
                "erro": "NUMEROS_INDISPONIVEIS",
                "numeros": sorted(list(conflito))
            }
        )

    # ===============================
    # CRIAR COMPRA PENDENTE
    # ===============================
    numeros_str = "|".join(map(str, sorted(numeros)))

    compra_id = executar_insert(
        """
        INSERT INTO rifa_compras
        (rifa_id, numeros, nome, whatsapp, email, mensagem, pago)
        VALUES (%s, %s, %s, %s, %s, %s, 0)
        """,
        (rifa_id, numeros_str, nome, whatsapp, email, mensagem)
    )

    # ===============================
    # VALOR TOTAL
    # ===============================
    total = preco * len(numeros)

    return {
        "compra_id": compra_id,
        "total": total
    }


@router.post("/{rifa_id}/pagamento/pix")
def criar_pagamento_pix(rifa_id: int, data: dict):

    compra_id = data.get("compra_id")
    total = data.get("total")
    email = data.get("email")

    if not compra_id or not total or not email:
        raise HTTPException(400, "Dados inválidos")

    # normaliza email
    email = email.strip().lower()

    if "@" not in email or "." not in email:
        raise HTTPException(400, "Email inválido para pagamento PIX")

    payment_data = {
        "transaction_amount": float(total),
        "description": f"Rifa {rifa_id} - Compra #{compra_id}",
        "payment_method_id": "pix",
        "payer": {
            "email": email
        },
        "external_reference": str(compra_id),
        "notification_url": "https://ironexecutions-backend.onrender.com/rifa/webhook/mercadopago"
    }

    payment = sdk.payment().create(payment_data)

    # LOG CRU PARA DEBUG
    print("MP RAW RESPONSE:", payment)

    if payment.get("status") != 201:
        raise HTTPException(
            400,
            {
                "erro": "ERRO_MERCADO_PAGO",
                "detalhe": payment.get("response")
            }
        )

    response = payment.get("response", {})

    transaction = (
        response
        .get("point_of_interaction", {})
        .get("transaction_data")
    )

    if not transaction:
        raise HTTPException(
            500,
            {
                "erro": "PIX_NAO_GERADO",
                "detalhe": response
            }
        )

    return {
        "id": response["id"],
        "qr_code": transaction.get("qr_code"),
        "qr_code_base64": transaction.get("qr_code_base64")
    }

@router.post("/webhook/mercadopago")
def webhook_mercadopago(data: dict):

    # 🔥 SUPORTA TODOS OS FORMATOS DO MERCADO PAGO
    payment_id = (
        data.get("data", {}).get("id")
        or data.get("id")
    )

    if not payment_id:
        return {"ok": True}

    payment = sdk.payment().get(payment_id)
    response = payment.get("response")

    if not response:
        return {"ok": True}

    status = response.get("status")
    external_reference = response.get("external_reference")
    valor_pago = response.get("transaction_amount")

    if status != "approved" or not external_reference:
        return {"ok": True}

    # 🔒 GARANTE TIPO CORRETO
    try:
        compra_id = int(external_reference)
    except:
        return {"ok": True}

    # 🔒 BUSCAR COMPRA
    compra = executar_select(
        """
        SELECT id, pago, numeros, rifa_id
        FROM rifa_compras
        WHERE id = %s
        """,
        (compra_id,)
    )

    if not compra:
        return {"ok": True}

    if compra[0]["pago"] == 1:
        return {"ok": True}

    # 🔒 BUSCAR PREÇO DA RIFA
    rifa = executar_select(
        "SELECT preco FROM rifa_registro WHERE id = %s",
        (compra[0]["rifa_id"],)
    )

    if not rifa:
        return {"ok": True}

    preco = float(rifa[0]["preco"])
    quantidade = len(compra[0]["numeros"].split("|"))
    total_esperado = preco * quantidade

    # 🔴 VALOR NÃO CONFERE
    if float(valor_pago) != float(total_esperado):
        return {"ok": True}

    # ✅ CONFIRMAR PAGAMENTO
    executar_insert(
        """
        UPDATE rifa_compras
        SET pago = 1
        WHERE id = %s
        """,
        (compra_id,)
    )

    return {"ok": True}

@router.get("/pagamento/status/{payment_id}")
def status_pagamento(payment_id: int):
    payment = sdk.payment().get(payment_id)
    response = payment.get("response")

    if not response:
        return {"status": "unknown"}

    return {
        "status": response.get("status")
    }
@router.post("/{rifa_id}/pagamento/cartao")
def criar_pagamento_cartao(rifa_id: int, data: dict):

    compra_id = data.get("compra_id")
    total = data.get("total")
    email = data.get("email")

    token = data.get("token")
    issuer_id = data.get("issuer_id")
    payment_method_id = data.get("payment_method_id")
    installments = data.get("installments", 1)

    if not all([
        compra_id,
        total,
        email,
        token,
        issuer_id,
        payment_method_id
    ]):
        raise HTTPException(400, "Dados do cartão incompletos")

    payment_data = {
        "transaction_amount": float(total),
        "token": token,
        "description": f"Rifa {rifa_id} - Compra #{compra_id}",
        "installments": int(installments),
        "payment_method_id": payment_method_id,
        "issuer_id": issuer_id,
        "payer": {
            "email": email
        },
        "external_reference": str(compra_id),
        "notification_url": "https://ironexecutions-backend.onrender.com/rifa/webhook/mercadopago"
    }

    payment = sdk.payment().create(payment_data)

    if "response" not in payment:
        raise HTTPException(
            500,
            {
                "erro": "MERCADO_PAGO_SEM_RESPONSE",
                "detalhe": payment
            }
        )

    response = payment["response"]

    if "id" not in response:
        raise HTTPException(
            400,
            {
                "erro": "ERRO_AO_CRIAR_PAGAMENTO_CARTAO",
                "detalhe": response
            }
        )

    status = response.get("status")
    status_detail = response.get("status_detail")

    return {
        "payment_id": response["id"],
        "status": status,
        "status_detail": status_detail
    }
@router.get("/compra/{compra_id}/pdf")
def baixar_pdf_compra(compra_id: int):

    compra = executar_select(
        """
        SELECT *
        FROM rifa_compras
        WHERE id = %s AND pago = 1
        """,
        (compra_id,)
    )

    if not compra:
        raise HTTPException(404, "Compra não encontrada ou não paga")

    compra = compra[0]

    rifa = executar_select(
        "SELECT * FROM rifa_registro WHERE id = %s",
        (compra["rifa_id"],)
    )[0]

    comercio = executar_select(
        """
        SELECT loja, email, celular
        FROM comercios_cadastradas
        WHERE id = %s
        """,
        (rifa["comercio_id"],)
    )[0]

    nome_pdf = gerar_pdf_compra(compra, rifa, comercio)
    caminho = f"pdfs/{nome_pdf}"

    return FileResponse(
        caminho,
        media_type="application/pdf",
        filename=nome_pdf
    )
