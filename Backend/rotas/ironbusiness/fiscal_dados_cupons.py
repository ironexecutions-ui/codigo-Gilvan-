from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

router = APIRouter(prefix="/fiscal", tags=["Fiscal"])
def exigir_admin(cliente):
    funcao = (cliente.get("funcao") or "").strip().lower()

    if funcao not in ["administrador(a)"]:
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito a administradores"
        )


# ===============================
# MODELO DE DADOS
# ===============================
class FiscalDados(BaseModel):
    tipo: str
    produto_id: int

    # PRODUTO (NFC-e)
    ncm: str | None = None
    cfop: str | None = None
    origem: str | None = None
    cst_csosn: str | None = None
    icms: float | None = None
    pis: float | None = None
    cofins: float | None = None
    cest: str | None = None

    # SERVIÇO (NFS-e)
    codigo_servico: str | None = None
    aliquota_iss: float | None = None
    municipio: str | None = None


# ===============================
# LISTAR PRODUTOS E SERVIÇOS
# ===============================
@router.get("/produtos-servicos")
def listar_produtos_servicos(cliente=Depends(verificar_token_cliente)):

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio or not comercio[0]["comercio_id"]:
        raise HTTPException(
            status_code=403,
            detail="Cliente sem comércio vinculado"
        )

    comercio_id = comercio[0]["comercio_id"]

    sql = """
        SELECT id, nome, unidade, unidades, tempo_servico
        FROM produtos_servicos
        WHERE comercio_id = %s
        ORDER BY nome ASC
    """

    return executar_select(sql, (comercio_id,))


# ===============================
# REGISTRAR DADOS FISCAIS
# ===============================

@router.post("/registrar")
def registrar_dados_fiscais(
    dados: FiscalDados,
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)
    # -------------------------------
    # BUSCAR COMÉRCIO DO CLIENTE
    # -------------------------------
    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio or not comercio[0]["comercio_id"]:
        raise HTTPException(
            status_code=403,
            detail="Cliente sem comércio vinculado"
        )

    comercio_id = comercio[0]["comercio_id"]

    # -------------------------------
    # VALIDAÇÃO FISCAL OBRIGATÓRIA
    # -------------------------------
    if dados.tipo == "produto":
        obrigatorios = [
            dados.ncm,
            dados.cfop,
            dados.origem,
            dados.cst_csosn,
            dados.icms,
            dados.pis,
            dados.cofins
        ]
    elif dados.tipo == "servico":
        obrigatorios = [
            dados.codigo_servico,
            dados.aliquota_iss,
            dados.municipio
        ]
    else:
        raise HTTPException(
            status_code=400,
            detail="Tipo inválido. Use 'produto' ou 'servico'"
        )

    if any(v is None or v == "" for v in obrigatorios):
        raise HTTPException(
            status_code=400,
            detail="Todos os campos fiscais obrigatórios devem ser preenchidos"
        )

    # -------------------------------
    # INSERÇÃO NO BANCO
    # -------------------------------
    sql = """
        INSERT INTO fiscal_dados_cupons (
            tipo,
            comercio_id,
            produto_id,

            ncm,
            cfop,
            origem,
            cst_csosn,
            icms,
            pis,
            cofins,
            cest,

            codigo_servico,
            aliquota_iss,
            municipio
        ) VALUES (
            %s,%s,%s,
            %s,%s,%s,%s,%s,%s,%s,%s,
            %s,%s,%s
        )
    """

    executar_comando(sql, (
        dados.tipo,
        comercio_id,
        dados.produto_id,

        dados.ncm,
        dados.cfop,
        dados.origem,
        dados.cst_csosn,
        dados.icms,
        dados.pis,
        dados.cofins,
        dados.cest,

        dados.codigo_servico,
        dados.aliquota_iss,
        dados.municipio
    ))

    return {
        "status": "ok",
        "mensagem": "Dados fiscais registrados com sucesso"
    }
@router.get("/sugestoes/{campo}")
def sugestoes_fiscais(campo: str, cliente=Depends(verificar_token_cliente)):

    campos_permitidos = [
        "cfop",
        "cst_csosn",
        "origem",
        "cest",
        "codigo_servico",
        "municipio"
    ]

    if campo not in campos_permitidos:
        raise HTTPException(status_code=400, detail="Campo inválido")

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))
    comercio_id = comercio[0]["comercio_id"]

    sql = f"""
        SELECT DISTINCT {campo}
        FROM fiscal_dados_cupons
        WHERE comercio_id = %s
        AND {campo} IS NOT NULL
        AND {campo} != ''
        ORDER BY {campo}
    """

    return executar_select(sql, (comercio_id,))

@router.get("/registrados")
def listar_fiscais_registrados(
    tipo: str,
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)

    if tipo not in ["produto", "servico"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))

    if not comercio or not comercio[0]["comercio_id"]:
        raise HTTPException(status_code=403, detail="Cliente sem comércio")

    comercio_id = comercio[0]["comercio_id"]

    sql = """
        SELECT
            f.id AS fiscal_id,
            f.tipo,
            f.produto_id,

            p.nome,
            p.codigo_barras,
            p.unidade,
            p.unidades,
            p.tempo_servico,

            f.ncm,
            f.cfop,
            f.origem,
            f.cst_csosn,
            f.icms,
            f.pis,
            f.cofins,
            f.cest,

            f.codigo_servico,
            f.aliquota_iss,
            f.municipio
        FROM fiscal_dados_cupons f
        INNER JOIN produtos_servicos p ON p.id = f.produto_id
        WHERE f.comercio_id = %s
        AND f.tipo = %s
        ORDER BY p.nome ASC
    """

    return executar_select(sql, (comercio_id, tipo))
@router.get("/dados/{produto_id}")
def obter_dados_fiscais(
    produto_id: int,
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))
    comercio_id = comercio[0]["comercio_id"]

    sql = """
        SELECT *
        FROM fiscal_dados_cupons
        WHERE produto_id = %s
        AND comercio_id = %s
        LIMIT 1
    """

    dados = executar_select(sql, (produto_id, comercio_id))

    if not dados:
        raise HTTPException(status_code=404, detail="Dados fiscais não encontrados")

    return dados[0]

@router.put("/atualizar/{produto_id}")
def atualizar_dados_fiscais(
    produto_id: int,
    dados: FiscalDados,
    cliente=Depends(verificar_token_cliente)
):
    exigir_admin(cliente)

    sql_comercio = """
        SELECT comercio_id
        FROM clientes
        WHERE id = %s
        LIMIT 1
    """
    comercio = executar_select(sql_comercio, (cliente["id"],))
    comercio_id = comercio[0]["comercio_id"]

    sql = """
        UPDATE fiscal_dados_cupons SET
            ncm=%s,
            cfop=%s,
            origem=%s,
            cst_csosn=%s,
            icms=%s,
            pis=%s,
            cofins=%s,
            cest=%s,
            codigo_servico=%s,
            aliquota_iss=%s,
            municipio=%s
        WHERE produto_id=%s
        AND comercio_id=%s
    """

    executar_comando(sql, (
        dados.ncm,
        dados.cfop,
        dados.origem,
        dados.cst_csosn,
        dados.icms,
        dados.pis,
        dados.cofins,
        dados.cest,
        dados.codigo_servico,
        dados.aliquota_iss,
        dados.municipio,
        produto_id,
        comercio_id
    ))

    return {"status": "ok"}
