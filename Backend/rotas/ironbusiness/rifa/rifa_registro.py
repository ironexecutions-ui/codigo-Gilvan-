from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from zoneinfo import ZoneInfo

from ..auth_clientes import verificar_token_cliente
from database import executar_select, executar_comando

router = APIRouter(prefix="/rifa", tags=["Rifa"])

TZ_BR = ZoneInfo("America/Sao_Paulo")

@router.post("/criar")
def criar_rifa(dados: dict, usuario=Depends(verificar_token_cliente)):

    if usuario["funcao"] != "Administrador(a)":
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    cliente_id = usuario["id"]

    r = executar_select(
        """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
        """,
        (cliente_id,)
    )

    if not r or not r[0]["comercio_id"]:
        raise HTTPException(
            status_code=400,
            detail="Usuário não possui comércio vinculado"
        )

    comercio_id = r[0]["comercio_id"]

    nome = dados.get("nome")
    premio = dados.get("premio")
    inicio = dados.get("inicio")
    fim = dados.get("fim")
    preco = dados.get("preco")
    data_fim = dados.get("data_fim")
    fotos = dados.get("fotos")

    if not nome or not nome.strip():
        raise HTTPException(status_code=400, detail="Nome da rifa obrigatório")

    if not premio or not premio.strip():
        raise HTTPException(status_code=400, detail="Prêmio obrigatório")

    if not inicio or not fim or inicio >= fim:
        raise HTTPException(status_code=400, detail="Intervalo inválido")

    if not preco or float(preco) <= 0:
        raise HTTPException(status_code=400, detail="Preço inválido")

    if not data_fim:
        raise HTTPException(status_code=400, detail="Data de finalização obrigatória")

    try:
        data_fim_dt = datetime.fromisoformat(data_fim).replace(tzinfo=TZ_BR)
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de data inválido")

    agora = datetime.now(TZ_BR)

    if data_fim_dt <= agora:
        raise HTTPException(
            status_code=400,
            detail="Data de finalização deve ser futura"
        )

    numeros = f"{inicio}-{fim}"

    executar_comando(
        """
        INSERT INTO rifa_registro
        (comercio_id, nome, premio, fotos, numeros, preco, criado_em, data_fim)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            comercio_id,
            nome.strip(),
            premio.strip(),
            fotos,
            numeros,
            preco,
            agora,
            data_fim_dt
        )
    )

    return {
        "status": "ok",
        "mensagem": "Rifa registrada com sucesso"
    }


@router.get("/listar")
def listar_rifas(usuario=Depends(verificar_token_cliente)):

    cliente_id = usuario["id"]

    r = executar_select(
        """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
        """,
        (cliente_id,)
    )

    if not r or not r[0]["comercio_id"]:
        raise HTTPException(
            status_code=400,
            detail="Usuário não possui comércio vinculado"
        )

    comercio_id = r[0]["comercio_id"]

    rifas = executar_select(
        """
        SELECT
            id,
            nome,
            premio,
            numeros,
            preco,
            data_fim
        FROM rifa_registro
        WHERE comercio_id = %s
        ORDER BY criado_em DESC
        """,
        (comercio_id,)
    )

    # ===============================
    # AJUSTES DE EXIBIÇÃO
    # ===============================
    for rifa in rifas:
        if rifa.get("numeros") and "-" in rifa["numeros"]:
            inicio, fim = rifa["numeros"].split("-")
            rifa["intervalo"] = f"De {inicio} até {fim}"
        else:
            rifa["intervalo"] = "Intervalo indefinuido"

        rifa["link_publico"] = f"https://ironexecutions.com.br/rifa-compras/{rifa['id']}"
        rifa["link_admin"] = f"https://ironexecutions.com.br/rifa-admin/{rifa['id']}"

    return {"rifas": rifas}
@router.get("/{rifa_id}/compras-detalhadas")
def compras_detalhadas(rifa_id: int):
    sql = """
        SELECT
            c.id,
            c.nome,
            c.email,
            c.whatsapp,
            c.mensagem,
            c.numeros
        FROM rifa_compras c
        WHERE c.rifa_id = %s
          AND c.pago = 1
    """

    res = executar_select(sql, (rifa_id,))

    resultado = []

    for compra in res:
        numeros = compra["numeros"].split("|")

        for n in numeros:
            resultado.append({
                "numero": int(n),
                "nome": compra["nome"],
                "email": compra["email"],
                "whatsapp": compra["whatsapp"],
                "mensagem": compra["mensagem"]
            })

    return resultado


@router.post("/{rifa_id}/sortear")
def sortear_rifa(rifa_id: int):

    # ===============================
    # BUSCAR RIFA
    # ===============================
    rifa = executar_select(
        "SELECT ganhador, numeros FROM rifa_registro WHERE id = %s",
        (rifa_id,)
    )

    if not rifa:
        raise HTTPException(404, "Rifa não encontrada")

    if rifa[0]["ganhador"] not in (None, 0):
        raise HTTPException(
            400,
            "Sorteio já realizado. O resultado é definitivo e não pode ser alterado."
        )

    # ===============================
    # INTERVALO DA RIFA
    # ===============================
    try:
        inicio, fim = map(int, rifa[0]["numeros"].split("-"))
    except Exception:
        raise HTTPException(400, "Intervalo da rifa inválido")

    # ===============================
    # SORTEAR NÚMERO REAL
    # ===============================
    import random
    numero_sorteado = random.randint(inicio, fim)

    # ===============================
    # VERIFICAR SE ALGUÉM COMPROU
    # ===============================
    compra = executar_select(
        """
        SELECT nome, email, whatsapp
        FROM rifa_compras
        WHERE rifa_id = %s
          AND pago = 1
          AND FIND_IN_SET(%s, REPLACE(numeros, '|', ',')) > 0
        LIMIT 1
        """,
        (rifa_id, numero_sorteado)
    )

    # ===============================
    # REGISTRAR RESULTADO (SEMPRE)
    # ===============================
    executar_comando(
        "UPDATE rifa_registro SET ganhador = %s WHERE id = %s",
        (numero_sorteado, rifa_id)
    )

    # ===============================
    # CASO NÃO TENHA COMPRADOR
    # ===============================
    if not compra:
        return {
            "numero": numero_sorteado,
            "sem_ganhador": True
        }

    # ===============================
    # CASO TENHA GANHADOR
    # ===============================
    return {
        "numero": numero_sorteado,
        "sem_ganhador": False,
        "nome": compra[0]["nome"],
        "email": compra[0]["email"],
        "whatsapp": compra[0]["whatsapp"]
    }
@router.get("/{rifa_id}/resultado")
def resultado_rifa(rifa_id: int):

    rifa = executar_select(
        "SELECT ganhador, numeros FROM rifa_registro WHERE id = %s",
        (rifa_id,)
    )

    if not rifa:
        raise HTTPException(404, "Rifa não encontrada")

    ganhador = rifa[0]["ganhador"]

    # Ainda não foi sorteada
    if not ganhador or ganhador == 0:
        return {
            "sorteado": False
        }

    # ===============================
    # VERIFICAR SE ALGUÉM COMPROU
    # ===============================
    compra = executar_select(
        """
        SELECT nome, email, whatsapp
        FROM rifa_compras
        WHERE rifa_id = %s
          AND pago = 1
          AND FIND_IN_SET(%s, REPLACE(numeros, '|', ',')) > 0
        LIMIT 1
        """,
        (rifa_id, ganhador)
    )

    if not compra:
        return {
            "sorteado": True,
            "numero": ganhador,
            "sem_ganhador": True
        }

    return {
        "sorteado": True,
        "numero": ganhador,
        "sem_ganhador": False,
        "nome": compra[0]["nome"],
        "email": compra[0]["email"],
        "whatsapp": compra[0]["whatsapp"]
    }
