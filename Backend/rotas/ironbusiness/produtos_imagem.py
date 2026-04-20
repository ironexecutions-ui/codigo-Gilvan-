from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from supabase import create_client, Client
import uuid
from pydantic import BaseModel

from .auth_clientes import verificar_token_cliente

router = APIRouter(
    prefix="/upload/client",
    tags=["Upload/client"]
)

SUPABASE_URL = "https://mtljmvivztkgoolnnwxc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGptdml2enRrZ29vbG5ud3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQwMzM0MywiZXhwIjoyMDc4OTc5MzQzfQ.XFJVnYVbK-pxJ7oftduk680YsXltdUB06Yr_buIoJPA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# UPLOAD DE IMAGENS
# =========================
@router.post("/imagens")
async def upload_imagens(
    arquivos: list[UploadFile] = File(...),
    pasta: str = Form(...),
    cliente=Depends(verificar_token_cliente)
):
    urls = []

    for arquivo in arquivos:
        if not arquivo.content_type.startswith("image/"):
            continue

        conteudo = await arquivo.read()
        ext = arquivo.filename.split(".")[-1]
        nome_unico = f"{uuid.uuid4()}.{ext}"
        caminho = f"{pasta}/{nome_unico}"

        supabase.storage.from_("assinaturas").upload(
            caminho,
            conteudo,
            {"content-type": arquivo.content_type}
        )

        url_publica = (
            f"{SUPABASE_URL}/storage/v1/object/public/assinaturas/{caminho}"
        )

        urls.append(url_publica)

    return {
        "ok": True,
        "urls": "|".join(urls)
    }

class DeleteImagem(BaseModel):
    url: str

@router.delete("/imagem")
def deletar_imagem(
    dados: DeleteImagem,
    cliente=Depends(verificar_token_cliente)
):
    try:
        caminho = dados.url.split("/assinaturas/")[1]
    except IndexError:
        raise HTTPException(status_code=400, detail="URL inválida")

    supabase.storage.from_("assinaturas").remove([caminho])

    return {"ok": True}
