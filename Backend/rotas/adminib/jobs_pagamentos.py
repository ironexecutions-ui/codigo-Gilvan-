import os
from dateutil.relativedelta import relativedelta
import mercadopago

from database import conectar

MP_TOKEN = os.getenv("MP_ACCESS_TOKEN")
if not MP_TOKEN:
    raise Exception("MP_ACCESS_TOKEN não configurado no .env")

sdk = mercadopago.SDK(MP_TOKEN)


def cobrar_pagamentos_automaticos():

    conn = conectar()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            p.id,
            p.mes,
            p.comercio_id,
            a.valor,
            c.token_mp,
            c.email,
            c.payment_method_id
        FROM servico_ib_pagamentos p
        JOIN servicos_ib_aluguel a 
            ON a.comercio_id = p.comercio_id
        JOIN cartoes_ib c 
            ON c.comercio_id = p.comercio_id
        WHERE p.mes <= CURDATE()
          AND p.situacao = 'espera'
          AND c.ativo = 1
    """)

    pagamentos = cursor.fetchall()

    for pg in pagamentos:

        payment_data = {
            "transaction_amount": float(pg["valor"]),
            "token": pg["token_mp"],
            "installments": 1,
            "payment_method_id": pg["payment_method_id"],
            "payer": {
                "email": pg["email"]
            }
        }

        resp = sdk.payment().create(payment_data)["response"]

        print("MP AUTO RESPONSE:", resp)

        if resp.get("status") == "approved":

            cursor.execute(
                "UPDATE servico_ib_pagamentos SET situacao = 'pago' WHERE id = %s",
                (pg["id"],)
            )

            proximo_mes = pg["mes"] + relativedelta(months=1)

            cursor.execute("""
                INSERT INTO servico_ib_pagamentos (comercio_id, mes, situacao)
                VALUES (%s, %s, 'espera')
            """, (pg["comercio_id"], proximo_mes))

    conn.commit()
