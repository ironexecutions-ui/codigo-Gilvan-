from datetime import datetime


def log(msg):
    print(f"[NFCe-VALIDACAO][{datetime.now().strftime('%H:%M:%S')}] {msg}")


def validar_comercio_fiscal(fiscal):

    log("Iniciando validação fiscal do comércio")

    obrigatorios = [
        "razao_social",
        "crt",
        "ambiente_emissao",
        "serie_nfce",
        "numero_inicial_nfce",
        "certificado_path",
        "certificado_senha_enc",
        "csc_id",
        "csc_token"
    ]

    faltando = []

    for campo in obrigatorios:
        valor = fiscal.get(campo)
        if valor is None or str(valor).strip() == "":
            faltando.append(campo)

    if faltando:
        msg = "Dados fiscais do comércio incompletos: " + ", ".join(faltando)
        log(f"ERRO: {msg}")
        raise Exception(msg)

    # ===============================
    # VALIDAÇÕES DE NEGÓCIO
    # ===============================

    log("Validando ambiente de emissão")

    if fiscal["ambiente_emissao"] not in ["homologacao", "producao"]:
        raise Exception("Ambiente de emissão inválido")

    log("Validando série da NFC-e")

    if not str(fiscal["serie_nfce"]).isdigit():
        raise Exception("Série da NFC-e inválida")

    if int(fiscal["serie_nfce"]) <= 0:
        raise Exception("Série da NFC-e deve ser maior que zero")

    log("Validando número inicial da NFC-e")

    if not str(fiscal["numero_inicial_nfce"]).isdigit():
        raise Exception("Número inicial da NFC-e inválido")

    if int(fiscal["numero_inicial_nfce"]) <= 0:
        raise Exception("Número inicial da NFC-e deve ser maior que zero")

    log("Validando CRT")

    if fiscal["crt"] not in ["1", "2", "3"]:
        raise Exception("CRT inválido. Use 1 (Simples), 2 ou 3")

    # ===============================
    # CSC SP
    # ===============================

    log("Validando CSC")

    if not str(fiscal["csc_id"]).isdigit():
        raise Exception("CSC ID inválido")

    if len(str(fiscal["csc_token"])) < 10:
        raise Exception("CSC Token inválido")

    log("Validação fiscal do comércio concluída com sucesso")


def validar_produto_fiscal(produto):

    log(f"Validando produto fiscal | Produto ID: {produto.get('id')}")

    obrigatorios = [
        "cfop",
        "origem",
        "cst_csosn"
    ]

    faltando = []

    for campo in obrigatorios:
        valor = produto.get(campo)
        if valor is None or str(valor).strip() == "":
            faltando.append(campo)

    if faltando:
        msg = "Produto sem dados fiscais obrigatórios: " + ", ".join(faltando)
        log(f"ERRO: {msg}")
        raise Exception(msg)

    # ===============================
    # VALIDAÇÕES DE NEGÓCIO
    # ===============================

    log("Validando CFOP")

    if not str(produto["cfop"]).isdigit():
        raise Exception("CFOP inválido")

    log("Validando origem do produto")

    if produto["origem"] not in ["0", "1", "2", "3", "4", "5", "6", "7", "8"]:
        raise Exception("Origem do produto inválida")

    log("Validando CST/CSOSN")

    if not str(produto["cst_csosn"]).isdigit():
        raise Exception("CST/CSOSN inválido")

    # ===============================
    # CST x CSOSN (CRT)
    # ===============================

    crt = str(produto.get("crt", ""))

    log(f"Validando CST/CSOSN conforme CRT ({crt})")

    if crt == "1":
        # Simples Nacional → CSOSN
        if len(str(produto["cst_csosn"])) != 3:
            raise Exception("CSOSN inválido para Simples Nacional")
    else:
        # Regime Normal → CST
        if len(str(produto["cst_csosn"])) != 2:
            raise Exception("CST inválido para regime normal")

    # ===============================
    # PRODUTO x SERVIÇO
    # ===============================

    tipo = produto.get("tipo", "produto")

    log(f"Tipo do item: {tipo}")

    if tipo == "servico":
        if not produto.get("codigo_servico"):
            raise Exception("Serviço sem código de serviço")
    else:
        # Produto físico
        if not produto.get("ncm"):
            raise Exception("Produto sem NCM")

        if not str(produto["ncm"]).isdigit():
            raise Exception("NCM inválido")

    log("Produto validado com sucesso")
