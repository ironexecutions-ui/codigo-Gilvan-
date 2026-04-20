from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import uuid

router = APIRouter()

SUPABASE_URL = "..."
SUPABASE_KEY = "..."

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/upload/imagem")
async def upload_imagem(
    arquivo: UploadFile = File(...),
    pasta: str = Form(...)
):
    conteudo = await arquivo.read()

    ext = arquivo.filename.split(".")[-1]
    nome_unico = f"{uuid.uuid4()}.{ext}"
    caminho = f"{pasta}/{nome_unico}"

    supabase = get_supabase()

    supabase.storage.from_("assinaturas").upload(caminho, conteudo)
    url_final = supabase.storage.from_("assinaturas").get_public_url(caminho)

    return {
        "ok": True,
        "url": url_final
    }