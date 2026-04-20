from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from database import executar_select, executar_insert, executar_update
from datetime import date
import random

router = APIRouter(prefix="/aulas", tags=["Aulas"])

# =========================
# 📌 MODELS
# =========================

class RepresentanteCreate(BaseModel):
    nome_completo: str
    telefone: str
    contrato: str | None = None


class MatriculaCompleta(BaseModel):
    nome: str
    email: str
    senha: str
    idade: int
    telefone: str
    grupo: str | None = None
    data_inicio: date
    diaum: str | None = None
    diadois: str | None = None

    representante: RepresentanteCreate

    @validator("idade")
    def validar_idade(cls, v):
        if v < 14:
            raise ValueError("Idade mínima é 14")
        return v

    @validator("telefone")
    def validar_telefone(cls, v):
        import re
        if not re.fullmatch(r"\(\d{2}\)\s?\d{4,5}-\d{4}", v):
            raise ValueError("Telefone inválido. Use (99) 99999-9999")
        return v


class MatriculaUpdate(BaseModel):
    nome: str
    email: str
    senha: str
    idade: int
    telefone: str
    grupo: str | None = None
    data_inicio: date
    diaum: str | None = None
    diadois: str | None = None


class AulaCreate(BaseModel):
    matricula_id: int
    aula: int


class LoginMatricula(BaseModel):
    email: str
    senha: str


# =========================
# 🧱 CRIAR MATRÍCULA + REPRESENTANTE
# =========================

@router.post("/matricula")
def criar_matricula(dados: MatriculaCompleta):

    existe = executar_select(
        "SELECT id FROM aulas_matricula WHERE email = %s",
        (dados.email,)
    )

    if existe:
        raise HTTPException(400, "Email já cadastrado")

    codigo = f"{dados.nome[:2].upper()}{random.randint(1000,9999)}"

    try:
        # 🔥 cria aluno
        executar_insert("""
        INSERT INTO aulas_matricula 
        (codigo, nome, email, senha, idade, telefone, grupo, data_inicio, diaum, diadois)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            codigo,
            dados.nome,
            dados.email,
            dados.senha,
            dados.idade,
            dados.telefone,
            dados.groupo if hasattr(dados, 'groupo') else dados.grupo,
            dados.data_inicio,
            dados.diaum,
            dados.diadois
        ))

        # 🔥 pega id do aluno
        aluno = executar_select(
            "SELECT id FROM aulas_matricula WHERE email = %s",
            (dados.email,)
        )[0]

        matricula_id = aluno["id"]

        # 🔥 cria representante
        executar_insert("""
            INSERT INTO aulas_representantes
            (matricula_id, nome_completo, telefone, contrato)
            VALUES (%s,%s,%s,%s)
        """, (
            matricula_id,
            dados.representante.nome_completo,
            dados.representante.telefone,
            dados.representante.contrato
        ))

        return {"msg": "Aluno e representante cadastrados"}

    except Exception as e:
        raise HTTPException(500, str(e))


# =========================
# 🔍 LISTAR
# =========================

@router.get("/matricula")
def listar_matriculas():
    return executar_select("SELECT * FROM aulas_matricula ORDER BY id DESC")


# =========================
# ➕ AULA
# =========================

@router.post("/aula")
def adicionar_aula(dados: AulaCreate):

    aluno = executar_select(
        "SELECT id FROM aulas_matricula WHERE id = %s",
        (dados.matricula_id,)
    )

    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    try:
        executar_insert("""
            INSERT INTO aulas_aulas (matricula_id, aula)
            VALUES (%s,%s)
        """, (dados.matricula_id, dados.aula))

        return {"msg": "Aula adicionada"}

    except Exception as e:
        raise HTTPException(500, str(e))


# =========================
# 📊 RESUMO
# =========================

@router.get("/resumo")
def resumo():
    return executar_select("""
        SELECT 
            m.id,
            m.nome,
            m.email,
            m.grupo,
            MAX(a.aula) as ultima_aula
        FROM aulas_matricula m
        LEFT JOIN aulas_aulas a ON m.id = a.matricula_id
        GROUP BY m.id
        ORDER BY m.nome ASC
    """)


# =========================
# ✏️ EDITAR
# =========================

@router.put("/matricula/{id}")
def editar_matricula(id: int, dados: MatriculaUpdate):

    aluno = executar_select(
        "SELECT id FROM aulas_matricula WHERE id = %s",
        (id,)
    )

    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    try:
        executar_update("""
        UPDATE aulas_matricula SET
            nome=%s,
            email=%s,
            senha=%s,
            idade=%s,
            telefone=%s,
            grupo=%s,
            data_inicio=%s,
            diaum=%s,
            diadois=%s
        WHERE id=%s
        """, (
            dados.nome,
            dados.email,
            dados.senha,
            dados.idade,
            dados.telefone,
            dados.grupo,
            dados.data_inicio,
            dados.diaum,
            dados.diadois,
            id
        ))

        return {"msg": "Atualizado com sucesso"}

    except Exception as e:
        raise HTTPException(500, str(e))


# =========================
# 🔍 OBTER 1
# =========================

@router.get("/matricula/{id}")
def obter_matricula(id: int):

    aluno = executar_select(
        "SELECT * FROM aulas_matricula WHERE id = %s",
        (id,)
    )

    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")

    return aluno[0]


# =========================
# 🔐 LOGIN
# =========================

@router.post("/matricula/login")
def login_matricula(dados: LoginMatricula):

    aluno = executar_select(
        "SELECT * FROM aulas_matricula WHERE email = %s AND senha = %s",
        (dados.email, dados.senha)
    )

    if not aluno:
        raise HTTPException(401, "Email ou senha inválidos")

    return aluno[0]


# =========================
# 📚 LISTAR AULAS
# =========================

@router.get("/aulas/{matricula_id}")
def listar_aulas_aluno(matricula_id: int):

    aulas = executar_select(
        """
        SELECT aula 
        FROM aulas_aulas 
        WHERE matricula_id = %s
        ORDER BY aula ASC
        """,
        (matricula_id,)
    )

    return aulas