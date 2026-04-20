from fastapi import APIRouter, Query
from database import executar_select

router = APIRouter(
    prefix="/comercios",
    tags=["Comércios Públicos"]
)


@router.get("/buscar")
def buscar_comercio(nome: str = Query(default="")):
    """
    Endpoint público.
    Não exige login.
    Retorna sempre um objeto previsível.
    Compatível com executar_select que retorna dict.
    """

    if not nome.strip():
        dados = executar_select(
            """
            SELECT loja, imagem, email, celular
            FROM comercios_cadastradas
            WHERE id = 11
            LIMIT 1
            """
        )
    else:
        dados = executar_select(
            """
            SELECT loja, imagem, email, celular
            FROM comercios_cadastradas
            WHERE loja LIKE %s
            LIMIT 1
            """,
            (f"%{nome}%",)
        )

    if not dados:
        return {
            "loja": "",
            "imagem": "",
            "email": "",
            "celular": ""
        }

    comercio = dados[0]

    return {
        "loja": comercio.get("loja", ""),
        "imagem": comercio.get("imagem", ""),
        "email": comercio.get("email", ""),
        "celular": comercio.get("celular", "")
    }
