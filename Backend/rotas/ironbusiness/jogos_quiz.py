from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import executar_select, executar_comando

router = APIRouter(prefix="/jogos-quiz", tags=["Jogos Quiz"])

# =========================
# MODEL
# =========================
class QuizBase(BaseModel):
    dificuldade: str
    idioma: str
    pergunta: str
    a: str
    b: str
    c: str
    d: str
    resposta: str


# =========================
# LISTAR
# =========================
@router.get("/")
def listar():
    sql = """
        SELECT *
        FROM jogos_quiz
        ORDER BY id DESC
    """
    return executar_select(sql)


# =========================
# CRIAR
# =========================
@router.post("/")
def criar(d: QuizBase):
    if d.resposta not in ("a", "b", "c", "d"):
        raise HTTPException(400, "Resposta inválida")

    sql = """
        INSERT INTO jogos_quiz
        (dificuldade, idioma, pergunta, a, b, c, d, resposta)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """

    executar_comando(sql, (
        d.dificuldade,
        d.idioma,
        d.pergunta,
        d.a,
        d.b,
        d.c,
        d.d,
        d.resposta
    ))

    return {"ok": True}


# =========================
# EDITAR
# =========================
@router.put("/{id}")
def editar(id: int, d: QuizBase):
    sql = """
        UPDATE jogos_quiz SET
            dificuldade = %s,
            idioma = %s,
            pergunta = %s,
            a = %s,
            b = %s,
            c = %s,
            d = %s,
            resposta = %s
        WHERE id = %s
    """

    executar_comando(sql, (
        d.dificuldade,
        d.idioma,
        d.pergunta,
        d.a,
        d.b,
        d.c,
        d.d,
        d.resposta,
        id
    ))

    return {"ok": True}


# =========================
# APAGAR
# =========================
@router.delete("/{id}")
def apagar(id: int):
    sql = "DELETE FROM jogos_quiz WHERE id = %s"
    executar_comando(sql, (id,))
    return {"ok": True}
