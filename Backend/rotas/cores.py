from fastapi import APIRouter
from database import executar_select, executar_insert, executar_comando

router = APIRouter(prefix="/paleta")

# =========================
# CRIAR QUADRO (FASE NOME)
# =========================
@router.post("/nome")
async def criar_quadro(dados: dict):
    nome = dados.get("nome")

    existente = executar_select(
        "SELECT id FROM paleta_quadros WHERE nome = %s",
        (nome,)
    )

    if existente:
        return { "ok": False, "erro": "Já existe um quadro com esse nome" }

    quadro_id = executar_insert(
        "INSERT INTO paleta_quadros (nome) VALUES (%s)",
        (nome,)
    )

    return { "ok": True, "quadro_id": quadro_id }


# =========================
# APAGAR FORMA
# =========================
@router.post("/forma/apagar")
async def apagar_forma(dados: dict):
    executar_comando(
        "DELETE FROM paleta_formas WHERE id = %s",
        (dados.get("forma_id"),)
    )
    return { "ok": True }


# =========================
# APAGAR QUADRO
# =========================
@router.post("/apagar")
async def apagar_quadro(dados: dict):
    executar_comando(
        "DELETE FROM paleta_quadros WHERE id = %s",
        (dados.get("quadro_id"),)
    )
    return { "ok": True }


# =========================
# SALVAR FORMAS
# =========================
@router.post("/formas")
async def salvar_formas(dados: dict):
    formas = dados.get("formas", [])
    quadro_id = dados.get("quadro_id")

    if not quadro_id:
        return { "ok": False, "erro": "Quadro não informado" }

    for f in formas:

        # Se a forma veio do banco, ela TEM id válido
        if isinstance(f.get("id"), int) and f["id"] > 0 and f["id"] < 1000000000:
            executar_comando("""
                UPDATE paleta_formas
                SET
                    pos_x = %s,
                    pos_y = %s,
                    largura = %s,
                    altura = %s,
                    cor_forma = %s,
                    texto = %s,
                    tamanho_texto = %s,
                    cor_texto = %s,
                    atualizado_em = NOW()
                WHERE id = %s AND quadro_id = %s
            """, (
                f["x"],
                f["y"],
                f["w"],
                f["h"],
                f.get("cor", "#d4af37"),
                f.get("texto", ""),
                f.get("tamanhoTexto", 16),
                f.get("corTexto", "#000000"),
                f["id"],
                quadro_id
            ))

        else:
            # IGNORA QUALQUER id VINDO DO FRONT
            executar_insert("""
                INSERT INTO paleta_formas (
                    quadro_id,
                    pos_x, pos_y,
                    largura, altura,
                    cor_forma,
                    texto,
                    tamanho_texto,
                    cor_texto
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                quadro_id,
                f["x"],
                f["y"],
                f["w"],
                f["h"],
                f.get("cor", "#d4af37"),
                f.get("texto", ""),
                f.get("tamanhoTexto", 16),
                f.get("corTexto", "#000000")
            ))

    executar_comando(
        "UPDATE paleta_quadros SET atualizado_em = NOW() WHERE id = %s",
        (quadro_id,)
    )

    return { "ok": True }

# =========================
# EDITAR FORMA
# =========================
@router.post("/editar")
async def editar_forma(dados: dict):
    forma = dados.get("forma")

    if not forma:
        return { "ok": False, "erro": "Forma não informada" }

    executar_comando("""
        UPDATE paleta_formas
        SET
            cor_forma = %s,
            texto = %s,
            tamanho_texto = %s,
            cor_texto = %s,
            atualizado_em = NOW()
        WHERE id = %s
    """, (
        forma.get("cor"),
        forma.get("texto"),
        forma.get("tamanhoTexto"),
        forma.get("corTexto"),
        forma.get("id")
    ))

    return { "ok": True }


# =========================
# LISTAR QUADROS
# =========================
@router.get("/quadros")
async def listar_quadros():
    quadros = executar_select(
        "SELECT * FROM paleta_quadros ORDER BY criado_em DESC"
    )
    return { "ok": True, "quadros": quadros }


# =========================
# CARREGAR FORMAS
# =========================
@router.get("/formas/{quadro_id}")
async def carregar_formas(quadro_id: int):
    formas = executar_select(
        "SELECT * FROM paleta_formas WHERE quadro_id = %s",
        (quadro_id,)
    )
    return { "ok": True, "formas": formas }

