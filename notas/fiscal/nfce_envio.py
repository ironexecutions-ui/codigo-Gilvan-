import requests
from lxml import etree
import hashlib
import base64
import tempfile
import os
from datetime import datetime

from cryptography.hazmat.primitives.serialization import (
    pkcs12, Encoding, PrivateFormat, NoEncryption
)
from cryptography.hazmat.backends import default_backend


def log(msg):
    print(f"[NFCe-ENVIO][{datetime.now().strftime('%H:%M:%S')}] {msg}")


URLS_SP = {
    "homologacao": "https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx",
    "producao": "https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx"
}


def _pfx_para_pem(certificado_path, senha):
    """
    Converte certificado A1 (.pfx) para arquivos PEM temporários
    Retorna (cert_pem, key_pem)
    """
    log("Convertendo certificado PFX para PEM")

    if not os.path.exists(certificado_path):
        raise Exception("Arquivo do certificado não encontrado")

    with open(certificado_path, "rb") as f:
        pfx_data = f.read()

    private_key, certificate, _ = pkcs12.load_key_and_certificates(
        pfx_data,
        senha.encode(),
        backend=default_backend()
    )

    if not private_key or not certificate:
        raise Exception("Certificado A1 inválido ou senha incorreta")

    temp_dir = tempfile.mkdtemp()

    cert_pem = os.path.join(temp_dir, "cert.pem")
    key_pem = os.path.join(temp_dir, "key.pem")

    with open(cert_pem, "wb") as f:
        f.write(certificate.public_bytes(Encoding.PEM))

    with open(key_pem, "wb") as f:
        f.write(
            private_key.private_bytes(
                Encoding.PEM,
                PrivateFormat.TraditionalOpenSSL,
                NoEncryption()
            )
        )

    log("Certificado convertido com sucesso")
    return cert_pem, key_pem


def enviar_nfce(xml_assinado, ambiente, certificado_path, certificado_senha, fiscal, total_nf):
    """
    Envia NFC-e real para SEFAZ-SP
    """
    log("===== INÍCIO ENVIO NFC-e =====")

    try:
        url = URLS_SP.get(ambiente)
        if not url:
            raise Exception("Ambiente inválido")

        log(f"Ambiente: {ambiente}")
        log(f"URL SEFAZ: {url}")
        log(f"Total NFC-e: R$ {total_nf:.2f}")

        # ===============================
        # CERTIFICADO (mTLS)
        # ===============================
        cert_pem, key_pem = _pfx_para_pem(
            certificado_path,
            certificado_senha
        )

        # ===============================
        # SOAP
        # ===============================
        log("Montando envelope SOAP")

        soap = f"""
        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                         xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
          <soap12:Header>
            <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
              <cUF>35</cUF>
              <versaoDados>4.00</versaoDados>
            </nfeCabecMsg>
          </soap12:Header>
          <soap12:Body>
            <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
              <![CDATA[{xml_assinado.decode()}]]>
            </nfeDadosMsg>
          </soap12:Body>
        </soap12:Envelope>
        """.strip()

        headers = {
            "Content-Type": "application/soap+xml; charset=utf-8"
        }

        # ===============================
        # ENVIO
        # ===============================
        log("Enviando NFC-e para SEFAZ")

        response = requests.post(
            url,
            data=soap.encode(),
            headers=headers,
            cert=(cert_pem, key_pem),
            verify=True,
            timeout=30
        )

        log(f"HTTP Status SEFAZ: {response.status_code}")

        if response.status_code != 200:
            raise Exception(
                f"Erro HTTP SEFAZ: {response.status_code} | {response.text[:200]}"
            )

        # ===============================
        # PROCESSA RETORNO
        # ===============================
        log("Processando retorno da SEFAZ")

        retorno_xml = etree.fromstring(response.content)

        ns = {"nfe": "http://www.portalfiscal.inf.br/nfe"}

        cStat = retorno_xml.findtext(".//nfe:cStat", namespaces=ns)
        xMotivo = retorno_xml.findtext(".//nfe:xMotivo", namespaces=ns)

        log(f"cStat: {cStat} | Motivo: {xMotivo}")

        if cStat != "100":
            raise Exception(
                f"NFC-e rejeitada: {cStat} - {xMotivo}"
            )

        protocolo = retorno_xml.findtext(".//nfe:nProt", namespaces=ns)
        chave = retorno_xml.findtext(".//nfe:chNFe", namespaces=ns)

        log(f"NFC-e autorizada | Chave: {chave}")
        log(f"Protocolo: {protocolo}")

        # ===============================
        # QR CODE SP
        # ===============================
        log("Gerando QR Code da NFC-e")

        qr_base = (
            f"chNFe={chave}"
            f"&nVersao=100"
            f"&tpAmb={'2' if ambiente == 'homologacao' else '1'}"
            f"&vNF={total_nf:.2f}"
            f"&cIdToken={fiscal['csc_id']}"
        )

        hash_qr = hashlib.sha1(
            (qr_base + fiscal["csc_token"]).encode()
        ).digest()

        hash_b64 = base64.b64encode(hash_qr).decode()

        qr_code_url = (
            "https://www.sefaz.sp.gov.br/NFCE/qrcode?"
            + qr_base +
            f"&cHashQRCode={hash_b64}"
        )

        log("QR Code gerado com sucesso")
        log("===== FIM ENVIO NFC-e =====")

        return {
            "status": "autorizada",
            "numero": int(chave[25:34]),
            "serie": int(chave[22:25]),
            "chave": chave,
            "qr_code": qr_code_url,
            "protocolo": protocolo
        }

    except Exception as e:
        log("ERRO NO ENVIO DA NFC-e")
        log(str(e))
        raise
