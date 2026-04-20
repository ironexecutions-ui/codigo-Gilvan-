import os
from fastapi import APIRouter, HTTPException
from dateutil.relativedelta import relativedelta
import mercadopago
from datetime import datetime, date
from database import conectar

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos IB"])

MP_TOKEN = os.getenv("MP_ACCESS_TOKEN")
if not MP_TOKEN:
    raise Exception("MP_ACCESS_TOKEN não configurado")

sdk = mercadopago.SDK(MP_TOKEN)
def finalizar_pagamento(cursor, pagamento_id, comercio_id, valor_pago):

    cursor.execute(
        "SELECT mes FROM servico_ib_pagamentos WHERE id = %s",
        (pagamento_id,)
    )
    atual = cursor.fetchone()

    if not atual:
        raise HTTPException(404, "Pagamento não encontrado")

    mes_atual = atual["mes"]

    # Converte se vier como string
    if isinstance(mes_atual, str):
        mes_atual = datetime.strptime(mes_atual, "%d/%m/%Y").date()

    # 1️⃣ marcar como pago e salvar o valor pago
    cursor.execute(
        """
        UPDATE servico_ib_pagamentos
        SET situacao = 'pago',
            valor = %s
        WHERE id = %s
        """,
        (valor_pago, pagamento_id)
    )

    # 2️⃣ calcular próximo mês
    proximo_mes = mes_atual + relativedelta(months=1)

    # 3️⃣ criar próximo mês com valor NULL
    cursor.execute(
        """
        INSERT INTO servico_ib_pagamentos (comercio_id, mes, situacao, valor)
        VALUES (%s, %s, 'espera', NULL)
        """,
        (comercio_id, proximo_mes)
    )

# ======================================================
# VERIFICAR PAGAMENTO DISPONÍVEL
# ======================================================
@router.get("/verificar/{aluguel_id}")
def verificar_pagamento(aluguel_id: int):

    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            a.valor,
            p.id AS pagamento_id,
            p.mes,
            p.comercio_id
        FROM servicos_ib_aluguel a
        JOIN servico_ib_pagamentos p
            ON a.comercio_id = p.comercio_id
        WHERE a.id = %s
          AND p.mes <= CURDATE()
          AND p.situacao = 'espera'
        ORDER BY p.mes ASC
        LIMIT 1
    """, (aluguel_id,))

    pagamento = cursor.fetchone()

    if not pagamento:
        return {"disponivel": False}

    return {
        "disponivel": True,
        "valor": float(pagamento["valor"]),
        "pagamento_id": pagamento["pagamento_id"],
        "comercio_id": pagamento["comercio_id"],
        "mes": pagamento["mes"]
    }


# ======================================================
# PAGAMENTO COM CARTÃO
# ======================================================
@router.post("/pagar")
def pagar(dados: dict):

    payment_data = {
        "transaction_amount": float(dados["valor"]),
        "description": "Pagamento IB",
        "payment_method_id": dados["payment_method_id"],
        "token": dados["token"],
        "installments": 1,
        "payer": {
            "email": dados["email"],
            "identification": {
                "type": "CPF",
                "number": dados["cpf"]
            }
        }
    }

    mp = sdk.payment().create(payment_data)["response"]

    if mp["status"] not in ["approved", "pending", "in_process"]:
        raise HTTPException(400, mp)

    # CARTÃO → FINALIZA NA HORA
    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    finalizar_pagamento(
    cursor,
    dados["pagamento_id"],
    dados["comercio_id"],
    float(dados["valor"])
)


    conn.commit()

    return {
        "ok": True,
        "status": mp["status"],
        "mp_id": mp["id"]
    }


# ======================================================
# GERAR PIX
# ======================================================
@router.post("/pagar-pix")
def pagar_pix(dados: dict):

    payment_data = {
        "transaction_amount": float(dados["valor"]),
        "payment_method_id": "pix",
        "description": "Pagamento IB via PIX",
        "payer": {
            "email": dados["email"]
        },
        # ESSENCIAL
        "metadata": {
            "pagamento_id": dados["pagamento_id"],
            "comercio_id": dados["comercio_id"]
        }
    }

    mp = sdk.payment().create(payment_data)["response"]

    if "point_of_interaction" not in mp:
        raise HTTPException(400, mp)

    return {
        "mp_id": mp["id"],
        "status": mp["status"],
        "qr_code": mp["point_of_interaction"]["transaction_data"]["qr_code"],
        "qr_code_base64": mp["point_of_interaction"]["transaction_data"]["qr_code_base64"]
    }


# ======================================================
# VERIFICAR STATUS PIX (FINALIZA NO BANCO)
# ======================================================
@router.get("/status/{mp_id}")
def status_pagamento(mp_id: int):

    mp = sdk.payment().get(mp_id)["response"]

    if mp["status"] == "approved":

        metadata = mp.get("metadata", {})
        pagamento_id = metadata.get("pagamento_id")
        comercio_id = metadata.get("comercio_id")

        valor_pago = mp.get("transaction_amount")

        if pagamento_id and comercio_id and valor_pago:
            conn = conectar()
            cursor = conn.cursor(dictionary=True)

            finalizar_pagamento(
                cursor,
                pagamento_id,
                comercio_id,
                float(valor_pago)
            )

            conn.commit()

    return {
        "status": mp["status"]
    }
