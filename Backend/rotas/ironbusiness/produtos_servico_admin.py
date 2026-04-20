from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Union, List
from database import executar_select, executar_comando, obter_comercio_id_do_cliente
from .auth_clientes import verificar_token_cliente
from datetime import date, timedelta

router = APIRouter(
    prefix="/admin/produtos-servicos",
    tags=["Admin - Produtos e Serviços"]
)

# ===============================
# MODELO
# ===============================
class ProdutoServico(BaseModel):
    nome: str
    unidade: Optional[str] = None
    codigo_barras: Optional[str] = None
    qrcode: Optional[str] = None
    preco: float
    preco_recebido: Optional[float] = 0
    categoria: Optional[str] = None
    imagem_url: Optional[Union[str, List[str]]] = None
    disponivel: int
    produto_id: Optional[int] = None
    unidades: Optional[int] = 0
    tempo_servico: Optional[str] = None
    data_vencimento: Optional[date] = None


# ===============================
# LISTAR
# ===============================
@router.get("/")
def listar(cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    sql = """
    SELECT 
        ps.*,
        p.nome AS nome_produto_base,
        CASE 
            WHEN ps.id < (
                SELECT MAX(ps2.id)
                FROM produtos_servicos ps2
                WHERE ps2.comercio_id = ps.comercio_id
                AND (
                    ps2.nome = ps.nome
                    OR (
                        ps.codigo_barras IS NOT NULL
                        AND ps.codigo_barras != ''
                        AND ps2.codigo_barras = ps.codigo_barras
                    )
                )
            )
            THEN 1
            ELSE 0
        END AS duplicado
    FROM produtos_servicos ps
    LEFT JOIN produtos_servicos p ON p.id = ps.produto_id
    WHERE ps.comercio_id = %s
    ORDER BY ps.nome, ps.id DESC
    """

    return executar_select(sql, (comercio_id,))

# ===============================
# CRIAR
# ===============================
@router.post("/")
def criar(dados: ProdutoServico, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    sql = """
        INSERT INTO produtos_servicos
        (nome, unidade, codigo_barras, qrcode, preco, preco_recebido, categoria,
         imagem_url, disponivel, produto_id, unidades, tempo_servico, data_vencimento, comercio_id)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    executar_comando(sql, (
        dados.nome,
        dados.unidade,
        dados.codigo_barras,
        dados.qrcode,
        dados.preco,
        dados.preco_recebido,
        dados.categoria,
        dados.imagem_url,
        dados.disponivel,
        dados.produto_id,
        dados.unidades,
        dados.tempo_servico,
        dados.data_vencimento,
        comercio_id
    ))

    return {"ok": True}

# ===============================
# EDITAR
# ===============================
@router.put("/{id}")
def editar(id: int, dados: ProdutoServico, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    sql = """
       UPDATE produtos_servicos SET
nome=%s, unidade=%s, codigo_barras=%s, qrcode=%s,
preco=%s, preco_recebido=%s, categoria=%s,
imagem_url=%s, disponivel=%s, produto_id=%s,
unidades=%s, tempo_servico=%s, data_vencimento=%s
WHERE id=%s AND comercio_id=%s

    """

    executar_comando(sql, (
        dados.nome,
        dados.unidade,
        dados.codigo_barras,
        dados.qrcode,
        dados.preco,
        dados.preco_recebido,
        dados.categoria,
        dados.imagem_url,
        dados.disponivel,
        dados.produto_id,
        dados.unidades,
        dados.tempo_servico,
        dados.data_vencimento,
        id,
        comercio_id
    ))

    return {"ok": True}

# ===============================
# APAGAR DUPLICADOS (COM CÓPIA DE CÓDIGO DE BARRAS)
# ===============================
@router.delete("/duplicados")
def apagar_duplicados(cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    # 1️⃣ Copia o codigo_barras do menor id para o maior id
    sql_update = """
    UPDATE produtos_servicos ps_keep
    JOIN (
        SELECT
            MAX(id) AS id_keep,
            MIN(id) AS id_del,
            comercio_id
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND codigo_barras IS NOT NULL
          AND codigo_barras != ''
        GROUP BY codigo_barras
    ) grp ON ps_keep.id = grp.id_keep
    JOIN produtos_servicos ps_del ON ps_del.id = grp.id_del
    SET ps_keep.codigo_barras = ps_del.codigo_barras
    WHERE ps_keep.comercio_id = %s
    """
    executar_comando(sql_update, (comercio_id, comercio_id))

    # 2️⃣ Apaga os duplicados, mantendo o maior id
    sql_delete = """
    DELETE ps
    FROM produtos_servicos ps
    JOIN (
        SELECT 
            MAX(id) AS id,
            nome,
            codigo_barras,
            comercio_id
        FROM produtos_servicos
        WHERE comercio_id = %s
        GROUP BY 
            comercio_id,
            CASE 
                WHEN codigo_barras IS NOT NULL AND codigo_barras != '' 
                THEN codigo_barras
                ELSE nome
            END
    ) ult 
    ON ult.comercio_id = ps.comercio_id
    AND (
        (ult.codigo_barras IS NOT NULL AND ult.codigo_barras != '' AND ps.codigo_barras = ult.codigo_barras)
        OR
        ((ult.codigo_barras IS NULL OR ult.codigo_barras = '') AND ps.nome = ult.nome)
    )
    AND ps.id < ult.id
    """
    executar_comando(sql_delete, (comercio_id,))

    return {"ok": True}

# ===============================
# APAGAR INDIVIDUAL
# ===============================
@router.delete("/{id}")
def apagar(id: int, cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    sql = "DELETE FROM produtos_servicos WHERE id=%s AND comercio_id=%s"
    executar_comando(sql, (id, comercio_id))

    return {"ok": True}


@router.get("/alerta-vencimento")
def alerta_vencimento(cliente=Depends(verificar_token_cliente)):
    comercio_id = obter_comercio_id_do_cliente(cliente["id"])

    hoje = date.today()
    limite = hoje + timedelta(days=7)

    sql = """
        SELECT COUNT(*) AS total
        FROM produtos_servicos
        WHERE comercio_id = %s
          AND data_vencimento IS NOT NULL
          AND data_vencimento <= %s
    """

    resultado = executar_select(sql, (comercio_id, limite))

    total = resultado[0]["total"] if resultado else 0

    return {
        "alerta": total > 0,
        "total": total
    }