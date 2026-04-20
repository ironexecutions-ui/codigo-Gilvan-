from fastapi import APIRouter
from pydantic import BaseModel
from database import conectar   

router = APIRouter()

class Servico(BaseModel):
    cliente: str
    loja: str
    data: str
    valor: float
    dias: int
    link: str | None = None
    processo: str = "andamento"   # NOVO

@router.get("/servicos")
def listar_servicos():
    db = conectar()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM servicos ORDER BY id DESC")
    dados = cursor.fetchall()
    cursor.close()
    db.close()
    return dados

@router.post("/servicos")
def criar_servico(servico: Servico):
    db = conectar()
    cursor = db.cursor()

    sql = """
    INSERT INTO servicos (cliente, loja, data, valor, dias, link, processo)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    valores = (
        servico.cliente,
        servico.loja,
        servico.data,
        servico.valor,
        servico.dias,
        servico.link,
        servico.processo
    )

    cursor.execute(sql, valores)
    db.commit()
    novo_id = cursor.lastrowid

    cursor.close()
    db.close()

    return {"id": novo_id, "mensagem": "Serviço criado com sucesso"}

@router.put("/servicos/{id}")
def atualizar_servico(id: int, servico: Servico):
    db = conectar()
    cursor = db.cursor()

    sql = """
    UPDATE servicos
    SET cliente = %s, loja = %s, data = %s, valor = %s, dias = %s, link = %s, processo = %s
    WHERE id = %s
    """
    valores = (
        servico.cliente,
        servico.loja,
        servico.data,
        servico.valor,
        servico.dias,
        servico.link,
        servico.processo,
        id
    )

    cursor.execute(sql, valores)
    db.commit()

    cursor.close()
    db.close()

    return {"mensagem": "Serviço atualizado com sucesso"}

@router.delete("/servicos/{id}")
def apagar_servico(id: int):
    db = conectar()
    cursor = db.cursor()

    cursor.execute("DELETE FROM servicos WHERE id = %s", (id,))
    db.commit()

    cursor.close()
    db.close()

    return {"mensagem": "Serviço removido com sucesso"}
class ProcessoUpdate(BaseModel):
    processo: str

@router.put("/servicos/processo/{id}")
def atualizar_processo(id: int, dados: ProcessoUpdate):
    db = conectar()
    cursor = db.cursor()

    sql = "UPDATE servicos SET processo = %s WHERE id = %s"
    cursor.execute(sql, (dados.processo, id))
    db.commit()

    cursor.close()
    db.close()

    return {"mensagem": "Processo atualizado com sucesso"}
