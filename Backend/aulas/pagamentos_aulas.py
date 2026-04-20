from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from dateutil.relativedelta import relativedelta
import mercadopago
import os

# 👇 IMPORTA SEU DB
from database import (
    executar_select,
    executar_insert,
    executar_update
)

router = APIRouter()

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))

# =========================
# MODEL
# =========================
class PagamentoRequest(BaseModel):
    id_pagamento: int


# =========================
# 🔎 BUSCAR PAGAMENTO
# =========================
@router.get("/pagamento/{id}")
def buscar_pagamento(id: int):

    sql = """
    SELECT 
        p.*,
        r.nome_completo AS representante_nome,
        m.nome AS aluno_nome
    FROM aulas_pagos p
    JOIN aulas_representantes r ON r.id = p.representante_id
    JOIN aulas_matricula m ON m.id = r.matricula_id
    WHERE p.id = %s
    """

    res = executar_select(sql, (id,))

    if not res:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    return res[0]

# =========================
# 💳 CRIAR PREFERENCIA
# =========================
@router.post("/pagamento/criar")
def criar_pagamento(req: PagamentoRequest):

    sql = "SELECT * FROM aulas_pagos WHERE id = %s"
    res = executar_select(sql, (req.id_pagamento,))

    if not res:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    pagamento = res[0]

    if pagamento["pago"] == 1:
        raise HTTPException(status_code=400, detail="Já pago")

    preference_data = {
        "items": [
            {
                "title": "Mensalidade Aula",
                "quantity": 1,
                "unit_price": float(pagamento["quanto"])
            }
        ]
    }

    pref = sdk.preference().create(preference_data)

    return {
        "id": pref["response"]["id"]
    }


# =========================
# ✅ CONFIRMAR PAGAMENTO
# =========================
@router.post("/pagamento/confirmar/{id}")
def confirmar_pagamento(id: int, metodo: str):

    sql = "SELECT * FROM aulas_pagos WHERE id = %s"
    res = executar_select(sql, (id,))

    if not res:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    pagamento = res[0]

    if pagamento["pago"] == 1:
        raise HTTPException(status_code=400, detail="Pagamento já confirmado")

    hoje = date.today()
    proximo_mes = hoje + relativedelta(months=1)

    # =========================
    # 1. ATUALIZA PAGAMENTO ATUAL
    # =========================
    executar_update("""
        UPDATE aulas_pagos
        SET pago = 1,
            tipo_pagamento = %s
        WHERE id = %s
    """, (metodo, id))

    # =========================
    # 2. CRIA PRÓXIMO PAGAMENTO
    # =========================
    executar_insert("""
        INSERT INTO aulas_pagos (
            representante_id,
            pago,
            data_pagamento,
            tipo_pagamento,
            quanto
        )
        VALUES (%s, 0, %s, NULL, %s)
    """, (
        pagamento["representante_id"],
        proximo_mes,
        pagamento["quanto"]
    ))

    return {"msg": "Pagamento confirmado e próximo gerado"}

@router.post("/pagamento/processar/{id}")
def processar_pagamento(id: int, body: dict):

    # 🔎 BUSCA PAGAMENTO
    sql = "SELECT * FROM aulas_pagos WHERE id = %s"
    res = executar_select(sql, (id,))

    if not res:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    pagamento = res[0]

    if pagamento["pago"] == 1:
        raise HTTPException(status_code=400, detail="Já pago")

    # 💳 DADOS PARA MERCADO PAGO
    payment_data = {
        "transaction_amount": float(pagamento["quanto"]),
        "token": body.get("token"),
        "description": "Mensalidade Aula",
        "installments": body.get("installments", 1),
        "payment_method_id": body.get("payment_method_id"),
        "issuer_id": body.get("issuer_id"),
        "payer": {
            "email": body.get("payer", {}).get("email"),
            "identification": {
                "type": body.get("payer", {}).get("identification", {}).get("type"),
                "number": body.get("payer", {}).get("identification", {}).get("number")
            }
        }
    }

    # 🔥 PROCESSA PAGAMENTO
    result = sdk.payment().create(payment_data)
    response = result["response"]

    # ✅ SE APROVADO
    status = response.get("status")

    # 🔥 considera aprovado OU pendente como válido
    if status in ["approved", "pending"]:
        proximo_mes = date.today() + relativedelta(months=1)

        # 🔥 ATUALIZA (SEM MEXER NA DATA)
        executar_update("""
            UPDATE aulas_pagos
            SET pago = 1,
                tipo_pagamento = %s
            WHERE id = %s
        """, (response["payment_method_id"], id))

        # 🔁 CRIA PRÓXIMA MENSALIDADE
        executar_insert("""
            INSERT INTO aulas_pagos (
                representante_id,
                pago,
                data_pagamento,
                tipo_pagamento,
                quanto
            )
            VALUES (%s, 0, %s, NULL, %s)
        """, (
            pagamento["representante_id"],
            proximo_mes,
            pagamento["quanto"]
        ))

    return {
        "status": response["status"]
    }
@router.post("/pagamento/pix/{id}")
def gerar_pix(id: int):

    sql = "SELECT * FROM aulas_pagos WHERE id = %s"
    res = executar_select(sql, (id,))

    if not res:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    pagamento = res[0]

    payment_data = {
        "transaction_amount": float(pagamento["quanto"]),
        "description": "Mensalidade Aula",
        "payment_method_id": "pix",
        "payer": {
            "email": "test_user@test.com"
        }
    }

    result = sdk.payment().create(payment_data)
    response = result["response"]

    status = response.get("status")

    # 🔥 AGORA VAI ATUALIZAR
    if status in ["pending", "approved"]:

        proximo_mes = date.today() + relativedelta(months=1)

        executar_update("""
            UPDATE aulas_pagos
            SET pago = 1,
                tipo_pagamento = 'pix'
            WHERE id = %s
        """, (id,))

        executar_insert("""
            INSERT INTO aulas_pagos (
                representante_id,
                pago,
                data_pagamento,
                tipo_pagamento,
                quanto
            )
            VALUES (%s, 0, %s, NULL, %s)
        """, (
            pagamento["representante_id"],
            proximo_mes,
            pagamento["quanto"]
        ))

    return {
        "qr_code": response["point_of_interaction"]["transaction_data"]["qr_code"],
        "qr_code_base64": response["point_of_interaction"]["transaction_data"]["qr_code_base64"],
        "status": response["status"]
    }