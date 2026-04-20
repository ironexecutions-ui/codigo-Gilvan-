from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import create_client, Client

from database import executar_select, executar_comando
from .auth_clientes import verificar_token_cliente

# ===============================
# SUPABASE
# ===============================
SUPABASE_URL = "https://mtljmvivztkgoolnnwxc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGptdml2enRrZ29vbG5ud3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQwMzM0MywiZXhwIjoyMDc4OTc5MzQzfQ.XFJVnYVbK-pxJ7oftduk680YsXltdUB06Yr_buIoJPA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/comercio", tags=["Comércio"])
def exigir_admin(cliente: dict):
    if cliente.get("funcao") != "Administrador(a)":
        raise HTTPException(
            status_code=403,
            detail="Sem permissão"
        )

# ===============================
# HELPER: OBTER COMERCIO_ID
# ===============================
def obter_comercio_id(cliente: dict) -> int:
    # 1. tenta direto do token
    comercio_id = cliente.get("comercio_id")
    if comercio_id:
        return comercio_id

    # 2. fallback pelo banco
    r = executar_select(
        "SELECT comercio_id FROM clientes WHERE id = %s",
        (cliente["id"],)
    )

    if not r or not r[0].get("comercio_id"):
        raise HTTPException(400, "Cliente não vinculado a um comércio")

    return r[0]["comercio_id"]


# ===============================
# BUSCAR COMÉRCIO DO CLIENTE
# ===============================
@router.get("/me")
async def comercio_me(cliente=Depends(verificar_token_cliente)):

    exigir_admin(cliente)

    comercio_id = obter_comercio_id(cliente)

    comercio = executar_select(
        "SELECT * FROM comercios_cadastradas WHERE id = %s",
        (comercio_id,)
    )

    if not comercio:
        raise HTTPException(404, "Comércio não encontrado")

    return comercio[0]

# ===============================
# EDITAR CAMPO INDIVIDUAL
# ===============================
@router.put("/editar-campo")
async def editar_campo(dados: dict, cliente=Depends(verificar_token_cliente)):

    exigir_admin(cliente)

    comercio_id = obter_comercio_id(cliente)

    campo = dados.get("campo")
    valor = dados.get("valor")

    campos_permitidos = [
        "loja",
        "cnpj",
        "email",
        "celular",
        "letra_tipo",
        "editar_preco",
        "api",
        "node",
        "produtividade",
        "administracao",
        "delivery_vendas",
        "mesas_salao_cozinha",
        "integracao_ifood",
        "agendamentos",
        "gerencial",
        "fiscal"
    ]

    if campo not in campos_permitidos:
        raise HTTPException(400, "Campo inválido")

    executar_comando(
        f"UPDATE comercios_cadastradas SET {campo} = %s WHERE id = %s",
        (valor, comercio_id)
    )

    return {"ok": True}


# ===============================
# EDITAR ENDEREÇO COMPLETO
# ===============================
@router.put("/endereco")
async def editar_endereco(dados: dict, cliente=Depends(verificar_token_cliente)):

    exigir_admin(cliente)

    campos = ["cep", "rua", "bairro", "numero", "cidade", "estado"]
    for c in campos:
        if not dados.get(c):
            raise HTTPException(400, "Endereço incompleto")

    comercio_id = obter_comercio_id(cliente)

    executar_comando(
        """
        UPDATE comercios_cadastradas
        SET
            cep = %s,
            rua = %s,
            bairro = %s,
            numero = %s,
            cidade = %s,
            estado = %s
        WHERE id = %s
        """,
        (
            dados["cep"],
            dados["rua"],
            dados["bairro"],
            dados["numero"],
            dados["cidade"],
            dados["estado"],
            comercio_id
        )
    )

    return {"ok": True}

# ===============================
# ATUALIZAR IMAGEM DO COMÉRCIO
# ===============================
@router.post("/imagem")
async def atualizar_imagem(
    arquivo: UploadFile = File(...),
    cliente=Depends(verificar_token_cliente)
):

    exigir_admin(cliente)

    comercio_id = obter_comercio_id(cliente)

    path = f"ironbusiness/comercio_{comercio_id}.png"

    conteudo = await arquivo.read()

    supabase.storage.from_("assinaturas").upload(
        path=path,
        file=conteudo,
        file_options={
            "content-type": arquivo.content_type,
            "upsert": "true"
        }
    )

    url = (
        f"{SUPABASE_URL}/storage/v1/object/public/"
        f"assinaturas/{path}"
    )

    executar_comando(
        "UPDATE comercios_cadastradas SET imagem = %s WHERE id = %s",
        (url, comercio_id)
    )

    return {"imagem": url}


@router.get("/tipos-letra")
def listar_tipos_letra():
    return [
        "Arial",
        "Helvetica",
        "Times New Roman",
        "Georgia",
        "Courier New",
        "Verdana",
        "Tahoma",
        "Trebuchet MS"
    ]