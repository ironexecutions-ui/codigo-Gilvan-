from lxml import etree
from datetime import datetime
from zoneinfo import ZoneInfo


def mapear_tpag(pagamento):
    mapa = {
        "dinheiro": "01",
        "cheque": "02",
        "credito": "03",
        "debito": "04",
        "pix": "17"
    }
    return mapa.get(str(pagamento).lower(), "99")


def gerar_xml_nfce(dados, qr_code_url):

    comercio = dados["comercio"]
    fiscal = dados["fiscal"]
    itens = dados["itens"]
    venda = dados["venda"]
    numero_nfce = dados["numero_nfce"]

    chave_acesso = dados["chave_acesso"]
    cNF = dados["cNF"]
    cDV = dados["cDV"]

    NFE = "http://www.portalfiscal.inf.br/nfe"
    nsmap = {None: NFE}

    nfe = etree.Element("NFe", nsmap=nsmap)

    infNFe = etree.SubElement(
        nfe,
        "infNFe",
        Id=f"NFe{chave_acesso}",
        versao="4.00"
    )

    # ===============================
    # IDE
    # ===============================
    ide = etree.SubElement(infNFe, "ide")
    etree.SubElement(ide, "cUF").text = chave_acesso[:2]
    etree.SubElement(ide, "cNF").text = cNF
    etree.SubElement(ide, "natOp").text = "VENDA"
    etree.SubElement(ide, "mod").text = "65"
    etree.SubElement(ide, "serie").text = str(fiscal["serie_nfce"])
    etree.SubElement(ide, "nNF").text = str(numero_nfce)
    etree.SubElement(
        ide,
        "dhEmi"
    ).text = datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat()
    etree.SubElement(ide, "tpNF").text = "1"
    etree.SubElement(ide, "idDest").text = "1"
    etree.SubElement(ide, "cMunFG").text = comercio["codigo_municipio"]
    etree.SubElement(ide, "tpImp").text = "4"
    etree.SubElement(ide, "tpEmis").text = "1"
    etree.SubElement(ide, "cDV").text = cDV
    etree.SubElement(
        ide,
        "tpAmb"
    ).text = "2" if fiscal["ambiente_emissao"] == "homologacao" else "1"
    etree.SubElement(ide, "finNFe").text = "1"
    etree.SubElement(ide, "indFinal").text = "1"
    etree.SubElement(ide, "indPres").text = "1"
    etree.SubElement(ide, "procEmi").text = "0"
    etree.SubElement(ide, "verProc").text = "IRON-1.0"

    # ===============================
    # EMITENTE
    # ===============================
    emit = etree.SubElement(infNFe, "emit")
    etree.SubElement(emit, "CNPJ").text = comercio["cnpj"]
    etree.SubElement(emit, "xNome").text = fiscal["razao_social"]
    etree.SubElement(emit, "IE").text = fiscal["inscricao_estadual"]
    etree.SubElement(emit, "CRT").text = fiscal["crt"]

    ender = etree.SubElement(emit, "enderEmit")
    etree.SubElement(ender, "xLgr").text = comercio["rua"]
    etree.SubElement(ender, "nro").text = comercio["numero"]
    etree.SubElement(ender, "xBairro").text = comercio["bairro"]
    etree.SubElement(ender, "cMun").text = comercio["codigo_municipio"]
    etree.SubElement(ender, "xMun").text = comercio["cidade"]
    etree.SubElement(ender, "UF").text = comercio["estado"]
    etree.SubElement(ender, "CEP").text = comercio["cep"].replace("-", "")
    etree.SubElement(ender, "cPais").text = "1058"
    etree.SubElement(ender, "xPais").text = "BRASIL"

    # ===============================
    # DESTINATÁRIO (CPF NA NFC-e)
    # ===============================
    cpf = venda.get("cpf_consumidor")

    if cpf:
        dest = etree.SubElement(infNFe, "dest")
        etree.SubElement(dest, "CPF").text = cpf
        etree.SubElement(dest, "indIEDest").text = "9"

    # ===============================
    # ITENS
    # ===============================
    total_produtos = 0

    for idx, item in enumerate(itens, start=1):
        det = etree.SubElement(infNFe, "det", nItem=str(idx))
        prod = etree.SubElement(det, "prod")

        etree.SubElement(prod, "cProd").text = str(item["id"])
        etree.SubElement(prod, "xProd").text = item["nome"]
        etree.SubElement(prod, "NCM").text = item["ncm"]
        etree.SubElement(prod, "CFOP").text = item["cfop"]
        etree.SubElement(prod, "uCom").text = "UN"
        etree.SubElement(prod, "qCom").text = f"{item['quantidade']:.2f}"
        etree.SubElement(prod, "vUnCom").text = f"{item['preco']:.2f}"

        v_prod = item["quantidade"] * item["preco"]
        etree.SubElement(prod, "vProd").text = f"{v_prod:.2f}"

        etree.SubElement(prod, "uTrib").text = "UN"
        etree.SubElement(prod, "qTrib").text = f"{item['quantidade']:.2f}"
        etree.SubElement(prod, "vUnTrib").text = f"{item['preco']:.2f}"
        etree.SubElement(prod, "indTot").text = "1"

        total_produtos += v_prod

        imposto = etree.SubElement(det, "imposto")

        icms = etree.SubElement(imposto, "ICMS")
        icms_sn = etree.SubElement(icms, "ICMSSN102")
        etree.SubElement(icms_sn, "orig").text = item["origem"]
        etree.SubElement(icms_sn, "CSOSN").text = item["cst_csosn"]

        pis = etree.SubElement(imposto, "PIS")
        pis_nt = etree.SubElement(pis, "PISNT")
        etree.SubElement(pis_nt, "CST").text = "08"

        cofins = etree.SubElement(imposto, "COFINS")
        cofins_nt = etree.SubElement(cofins, "COFINSNT")
        etree.SubElement(cofins_nt, "CST").text = "08"

    # ===============================
    # TOTAL
    # ===============================
    total = etree.SubElement(infNFe, "total")
    icmsTot = etree.SubElement(total, "ICMSTot")

    etree.SubElement(icmsTot, "vBC").text = "0.00"
    etree.SubElement(icmsTot, "vICMS").text = "0.00"
    etree.SubElement(icmsTot, "vICMSDeson").text = "0.00"
    etree.SubElement(icmsTot, "vFCP").text = "0.00"
    etree.SubElement(icmsTot, "vBCST").text = "0.00"
    etree.SubElement(icmsTot, "vST").text = "0.00"
    etree.SubElement(icmsTot, "vProd").text = f"{total_produtos:.2f}"
    etree.SubElement(icmsTot, "vFrete").text = "0.00"
    etree.SubElement(icmsTot, "vSeg").text = "0.00"
    etree.SubElement(icmsTot, "vDesc").text = "0.00"
    etree.SubElement(icmsTot, "vII").text = "0.00"
    etree.SubElement(icmsTot, "vIPI").text = "0.00"
    etree.SubElement(icmsTot, "vPIS").text = "0.00"
    etree.SubElement(icmsTot, "vCOFINS").text = "0.00"
    etree.SubElement(icmsTot, "vOutro").text = "0.00"
    etree.SubElement(icmsTot, "vTotTrib").text = "0.00"
    etree.SubElement(icmsTot, "vNF").text = f"{total_produtos:.2f}"

    # ===============================
    # TRANSPORTE (OBRIGATÓRIO)
    # ===============================
    transp = etree.SubElement(infNFe, "transp")
    etree.SubElement(transp, "modFrete").text = "9"

    # ===============================
    # PAGAMENTO
    # ===============================
    pag = etree.SubElement(infNFe, "pag")
    detPag = etree.SubElement(pag, "detPag")

    etree.SubElement(detPag, "tPag").text = mapear_tpag(venda["pagamento"])
    etree.SubElement(detPag, "vPag").text = f"{total_produtos:.2f}"

    # ===============================
    # INF NFE SUPL
    # ===============================
    infNFeSupl = etree.SubElement(nfe, "infNFeSupl")
    etree.SubElement(infNFeSupl, "qrCode").text = qr_code_url or ""
    etree.SubElement(
        infNFeSupl,
        "urlChave"
    ).text = "https://www.sistema.fazenda.sp.gov.br/SintegraPFE/ConsultaPublica/consultar"

    return etree.tostring(
        nfe,
        encoding="utf-8",
        xml_declaration=True
    )
# ==========================================
# FUNÇÕES AUXILIARES DE CHAVE
# ==========================================

def calcular_dv_mod11(chave):
    pesos = [2,3,4,5,6,7,8,9]
    soma = 0
    peso_index = 0

    for digito in reversed(chave):
        soma += int(digito) * pesos[peso_index]
        peso_index = (peso_index + 1) % len(pesos)

    resto = soma % 11
    dv = 11 - resto

    if dv >= 10:
        dv = 0

    return str(dv)


import random

def gerar_chave_acesso(
    cUF,
    ano_mes,
    cnpj,
    modelo,
    serie,
    numero,
    tpEmis="1"
):
    cNF = str(random.randint(10000000, 99999999))

    base = (
        f"{cUF}"
        f"{ano_mes}"
        f"{cnpj}"
        f"{modelo}"
        f"{str(serie).zfill(3)}"
        f"{str(numero).zfill(9)}"
        f"{tpEmis}"
        f"{cNF}"
    )

    dv = calcular_dv_mod11(base)

    chave = base + dv

    return chave, cNF, dv
