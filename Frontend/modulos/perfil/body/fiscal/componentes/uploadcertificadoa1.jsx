import React, { useState } from "react";
import { API_URL } from "../../../../../config";
import './uploadcertificadoa1.css'
export default function UploadCertificadoA1({ onSucesso }) {

    const token = localStorage.getItem("token");

    const [arquivo, setArquivo] = useState(null);
    const [senha, setSenha] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [mensagem, setMensagem] = useState("");

    async function enviar() {
        if (!arquivo || !senha) {
            setMensagem("Selecione o certificado e informe a senha");
            return;
        }

        const formData = new FormData();
        formData.append("arquivo", arquivo);
        formData.append("senha", senha);

        setEnviando(true);
        setMensagem("");

        try {
            const resp = await fetch(
                `${API_URL}/fiscal/comercio/upload-certificado`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const json = await resp.json();

            if (!resp.ok) {
                throw new Error(json.detail || "Erro ao enviar certificado");
            }

            setMensagem("Certificado enviado com sucesso");
            setArquivo(null);
            setSenha("");

            if (onSucesso) onSucesso();

        } catch (err) {
            setMensagem(err.message);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="bloco-certificado">

            <h5>Certificado Digital A1 (.pfx)</h5>

            <input
                type="file"
                accept=".pfx"
                onChange={e => setArquivo(e.target.files[0])}
            />

            <input
                type="password"
                placeholder="Senha do certificado"
                value={senha}
                onChange={e => setSenha(e.target.value)}
            />

            <button onClick={enviar} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar certificado"}
            </button>

            {mensagem && (
                <p className="mensagem-certificado">{mensagem}</p>
            )}
        </div>
    );
}
