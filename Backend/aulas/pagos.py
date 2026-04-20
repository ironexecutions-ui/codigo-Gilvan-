from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import executar_select, executar_insert
from datetime import date, datetime

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# =========================
# 📌 MODEL
# =========================

class PagoCreate(BaseModel):
    representante_id: int
    data_pagamento: date
    quanto: float


# =========================
# 🔍 LISTAR TODOS
# =========================

@router.get("/")
def listar_pagos():

    return executar_select("""
        SELECT 
            p.id,
            p.quanto,
            p.data_pagamento,
            r.nome_completo AS nome_representante,
            m.nome AS nome_aluno
        FROM aulas_pagos p
        JOIN aulas_representantes r ON p.representante_id = r.id
        JOIN aulas_matricula m ON r.matricula_id = m.id
        ORDER BY p.data_pagamento ASC
    """)


# =========================
# 📌 LISTAR REPRESENTANTES (DATALIST)
# =========================

@router.get("/representantes")
def listar_representantes():
    return executar_select("""
        SELECT id, nome_completo
        FROM aulas_representantes
        ORDER BY nome_completo ASC
    """)


# =========================
# ➕ CRIAR PAGAMENTO
# =========================
@router.post("/")
def criar_pago(dados: PagoCreate):

    # verifica se representante existe
    rep = executar_select(
        "SELECT id FROM aulas_representantes WHERE id = %s",
        (dados.representante_id,)
    )

    if not rep:
        raise HTTPException(404, "Representante não encontrado")

    try:
        # converte date -> datetime (sem hora visível)
        data_convertida = datetime.combine(dados.data_pagamento, datetime.min.time())

        executar_insert("""
            INSERT INTO aulas_pagos
            (representante_id, pago, data_pagamento, quanto)
            VALUES (%s, 0, %s, %s)
        """, (
            dados.representante_id,
            data_convertida,
            dados.quanto
        ))

        return {"msg": "Pagamento criado"}

    except Exception as e:
        raise HTTPException(500, str(e))
# =========================
# ⏳ PRÓXIMOS PAGOS
# =========================

@router.get("/proximos")
def proximos_pagos():

    return executar_select("""
        SELECT 
            p.id,
            p.data_pagamento,
            p.quanto,
            r.nome_completo,
            m.nome AS nome_aluno
        FROM aulas_pagos p
        JOIN aulas_representantes r ON p.representante_id = r.id
        JOIN aulas_matricula m ON r.matricula_id = m.id
        WHERE p.pago = 0
        ORDER BY p.data_pagamento ASC
    """)


# =========================
# ✅ PAGOS REALIZADOS
# =========================

@router.get("/realizados")
def pagos_realizados():

    return executar_select("""
        SELECT 
            p.id,
            p.data_pagamento,
            p.quanto,
            r.nome_completo,
            m.nome AS nome_aluno
        FROM aulas_pagos p
        JOIN aulas_representantes r ON p.representante_id = r.id
        JOIN aulas_matricula m ON r.matricula_id = m.id
        WHERE p.pago = 1
        ORDER BY p.data_pagamento DESC
    """)