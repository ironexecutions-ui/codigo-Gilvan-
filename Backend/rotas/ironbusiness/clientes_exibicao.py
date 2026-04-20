from fastapi import APIRouter
from database import executar_select

router = APIRouter(
    prefix="/exibicao",
    tags=["exibicao"]
)

@router.get("/funcionarios/{comercio_id}")
def listar_funcionarios(comercio_id: int):

    sql = """
        SELECT 
            c.loja,
            c.nome_completo,
            c.funcao,
            c.cargo
        FROM clientes c
        WHERE c.comercio_id = %s
    """

    dados = executar_select(sql, (comercio_id,))

    resposta = {
        "loja": dados[0]["loja"] if dados else "",
        "Administrador(a)": [],
        "Supervisor(a)": [],
        "Funcionario(a)": []
    }

    for d in dados:
        funcao = d["funcao"]

        if funcao == "Administrador(a)":
            chave = "Administrador(a)"
        elif funcao == "Supervisor(a)":
            chave = "Supervisor(a)"
        elif funcao == "Funcionario(a)":
            chave = "Funcionario(a)"
        else:
            continue

        resposta[chave].append({
            "nome": d["nome_completo"],
            "cargo": d["cargo"]
        })

    return resposta

