import { API_URL } from "../../config";

export default async function uploadImagemSupabase(arquivo, pasta) {

    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("pasta", pasta);

    const resp = await fetch(`${API_URL}/upload/imagem`, {
        method: "POST",
        body: formData
    });

    const json = await resp.json();

    if (!resp.ok) {
        console.log("Erro no upload:", json.detail);
        return null;
    }

    return json.url; // Agora funciona
}
