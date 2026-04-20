from fastapi import APIRouter
from database import conectar
from datetime import datetime, timedelta, date

router = APIRouter()

def data_para_datetime(valor):
    if isinstance(valor, datetime):
        return valor
    if isinstance(valor, date):
        return datetime.combine(valor, datetime.min.time())
    if isinstance(valor, str):
        return datetime.strptime(valor, "%Y-%m-%d")
    raise ValueError("Data inválida")


# ==============================
# GANHOS DO USUÁRIO LOGADO
# ==============================
@router.get("/ganhos/mensais")
def ganhos_mensais(email: str):

    db = conectar()
    cursor = db.cursor(dictionary=True)

    # Buscar dados do usuário
    cursor.execute("""
        SELECT id, nome, sobrenome, porcentagem
        FROM usuarios 
        WHERE email = %s
    """, (email,))
    usuario = cursor.fetchone()

    if not usuario:
        cursor.close()
        db.close()
        return []

    porcentagem = usuario["porcentagem"]
    id_usuario = usuario["id"]

    # Buscar SOMENTE os serviços pertencentes a esse usuário
    cursor.execute("""
        SELECT cliente, loja, data, valor, dias, link, processo
        FROM servicos
        WHERE processo = 'finalizado'
    """, )

    servicos = cursor.fetchall()

    cursor.close()
    db.close()

    meses = {}

    for s in servicos:
        data_original = data_para_datetime(s["data"])
        data_recebimento = data_original + timedelta(days=s["dias"])

        mes = data_recebimento.strftime("%Y-%m")

        if mes not in meses:
            meses[mes] = {"total_mes": 0, "servicos": []}

        meses[mes]["total_mes"] += float(s["valor"])
        meses[mes]["servicos"].append(s)

    resultado = []

    for mes, dados in meses.items():

        resultado.append({
            "mes": mes,
            "usuario": usuario["nome"] + " " + usuario["sobrenome"],
            "porcentagem": porcentagem,
            "ganho_usuario": dados["total_mes"] * porcentagem / 100,
            "total_mes": dados["total_mes"],
            "servicos": dados["servicos"]
        })

    resultado.sort(key=lambda x: x["mes"], reverse=True)
    return resultado



# ==============================
# GANHOS DOS SÓCIOS (COM SERVIÇOS)
# ==============================
@router.get("/ganhos/socios")
def ganhos_socios():

    db = conectar()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, nome, sobrenome, porcentagem
        FROM usuarios
        ORDER BY porcentagem DESC
    """)
    socios = cursor.fetchall()

    cursor.execute("""
        SELECT  cliente, loja, data, valor, dias, link, processo
        FROM servicos
        WHERE processo = 'finalizado'
    """)
    servicos = cursor.fetchall()

    cursor.close()
    db.close()

    meses_geral = {}

    for s in servicos:
        data_original = data_para_datetime(s["data"])
        data_recebimento = data_original + timedelta(days=s["dias"])
        mes = data_recebimento.strftime("%Y-%m")

        if mes not in meses_geral:
            meses_geral[mes] = {"total_mes": 0, "servicos": []}

        meses_geral[mes]["total_mes"] += float(s["valor"])
        meses_geral[mes]["servicos"].append(s)

    resultado = []

    for socio in socios:

        lista_meses = []

        for mes, dados in meses_geral.items():

            lista_meses.append({
                "mes": mes,
                "total_mes": dados["total_mes"],
                "ganho_socio": dados["total_mes"] * socio["porcentagem"] / 100,
                "porcentagem": socio["porcentagem"],
                "socio": socio["nome"] + " " + socio["sobrenome"],
                "servicos": dados["servicos"]
            })

        lista_meses.sort(key=lambda x: x["mes"], reverse=True)

        resultado.append({
            "socio": socio["nome"] + " " + socio["sobrenome"],
            "porcentagem": socio["porcentagem"],
            "meses": lista_meses
        })

    return resultado
