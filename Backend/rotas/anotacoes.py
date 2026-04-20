from fastapi import APIRouter
from database import executar_select, executar_insert, executar_comando

router = APIRouter()

SENHA_ARQUIVADOS = "20102025"


# =========================
# LISTAR NÃO ARQUIVADAS
# =========================
@router.get("/anotacoes")
async def listar_anotacoes():
    anotacoes = executar_select("""
        SELECT id, nome, arquivado, posicao
        FROM anotacoes
        WHERE arquivado = 0
        ORDER BY posicao ASC
    """)
    return { "ok": True, "anotacoes": anotacoes }


# =========================
# LISTAR ARQUIVADOS (PROTEGIDO POR SENHA)
# =========================
@router.post("/anotacoes/arquivados/verificar")
async def verificar_arquivados(dados: dict):
    senha = dados.get("senha")

    if senha != SENHA_ARQUIVADOS:
        return { "ok": False, "erro": "Senha incorreta" }

    anotacoes = executar_select("""
        SELECT id, nome, arquivado, posicao
        FROM anotacoes
        WHERE arquivado = 1
        ORDER BY posicao ASC
    """)

    return { "ok": True, "anotacoes": anotacoes }


# =========================
# CRIAR ANOTAÇÃO
# =========================
@router.post("/anotacoes")
async def salvar_anotacao(dados: dict):
    nome = dados.get("nome")

    if not nome:
        return { "ok": False, "erro": "Nome obrigatório" }

    executar_insert("""
        INSERT INTO anotacoes (nome, conteudo, arquivado, posicao)
        VALUES (%s, '', 0, 9999)
    """, (nome,))

    return { "ok": True }


# =========================
# OBTER ANOTAÇÃO (TEM QUE VIR DEPOIS DAS ROTAS FIXAS)
# =========================
@router.get("/anotacoes/{anotacao_id}")
async def obter_anotacao(anotacao_id: int):
    linha = executar_select("""
        SELECT id, nome, conteudo
        FROM anotacoes
        WHERE id = %s
    """, (anotacao_id,))

    if not linha:
        return { "ok": False }

    return { "ok": True, "anotacao": linha[0] }


# =========================
# ATUALIZAR CONTEÚDO
# =========================
@router.put("/anotacoes/{anotacao_id}")
async def atualizar_anotacao(anotacao_id: int, dados: dict):
    executar_comando("""
        UPDATE anotacoes
        SET conteudo = %s
        WHERE id = %s
    """, (dados.get("conteudo", ""), anotacao_id))

    return { "ok": True }


# =========================
# EDITAR NOME
# =========================
@router.put("/anotacoes/nome/{anotacao_id}")
async def editar_nome_anotacao(anotacao_id: int, dados: dict):
    nome = dados.get("nome")

    if not nome:
        return { "ok": False, "erro": "Nome obrigatório" }

    executar_comando("""
        UPDATE anotacoes
        SET nome = %s
        WHERE id = %s
    """, (nome, anotacao_id))

    return { "ok": True }


# =========================
# APAGAR
# =========================
@router.delete("/anotacoes/{anotacao_id}")
async def apagar_anotacao(anotacao_id: int):
    executar_comando("""
        DELETE FROM anotacoes
        WHERE id = %s
    """, (anotacao_id,))
    return { "ok": True }


# =========================
# ARQUIVAR
# =========================
@router.post("/anotacoes/arquivar")
async def arquivar_anotacao(dados: dict):
    executar_comando("""
        UPDATE anotacoes
        SET arquivado = 1
        WHERE id = %s
    """, (dados.get("id"),))
    return { "ok": True }


# =========================
# DESARQUIVAR
# =========================
@router.post("/anotacoes/desarquivar")
async def desarquivar_anotacao(dados: dict):
    executar_comando("""
        UPDATE anotacoes
        SET arquivado = 0
        WHERE id = %s
    """, (dados.get("id"),))
    return { "ok": True }


# =========================
# ORDENAR
# =========================
@router.post("/anotacoes/ordenar")
async def ordenar_anotacoes(dados: dict):
    for item in dados.get("lista", []):
        executar_comando("""
            UPDATE anotacoes
            SET posicao = %s
            WHERE id = %s
        """, (item["posicao"], item["id"]))

    return { "ok": True }
