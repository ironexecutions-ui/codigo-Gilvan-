import React, { useRef, useState } from "react";
import { API_URL } from "../../../../../config";
import "./formularioimagens.css";

export default function FormularioImagens({ valor, alterar }) {

    const imagensSalvas = valor
        ? valor.split("|").filter(Boolean)
        : [];

    const [preview, setPreview] = useState([]);
    const [arrastando, setArrastando] = useState(false);
    const inputRef = useRef(null);

    async function upload(files) {
        const token = localStorage.getItem("token");

        // preview local (blob)
        const blobs = Array.from(files).map(f =>
            URL.createObjectURL(f)
        );
        setPreview(prev => [...prev, ...blobs]);

        const formData = new FormData();
        formData.append("pasta", "produtos");
        Array.from(files).forEach(f =>
            formData.append("arquivos", f)
        );

        const resp = await fetch(`${API_URL}/upload/client/imagens`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const json = await resp.json();

        const novasUrls = json.urls.split("|").filter(Boolean);

        alterar([...imagensSalvas, ...novasUrls].join("|"));

        // 🔥 ESSA LINHA RESOLVE A DUPLICAÇÃO
        setPreview([]);
    }

    function remover(index) {
        const novaLista = imagensSalvas.filter((_, i) => i !== index);
        alterar(novaLista.join("|"));
    }

    function soltar(e) {
        e.preventDefault();
        setArrastando(false);
        if (e.dataTransfer.files.length) {
            upload(e.dataTransfer.files);
        }
    }

    return (
        <div className="imagens-container">

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => upload(e.target.files)}
            />

            <div
                className={`dropzone ${arrastando ? "ativo" : ""}`}
                onClick={() => inputRef.current.click()}
                onDragOver={e => {
                    e.preventDefault();
                    setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={soltar}
            >
                <strong>Arraste as imagens aqui</strong>
                <span>ou clique para adicionar</span>
            </div>

            {(imagensSalvas.length > 0 || preview.length > 0) && (
                <div className="lista-imagens">

                    {imagensSalvas.map((img, i) => (
                        <div className="imagem-card" key={`db-${i}`}>
                            <img src={img} alt="" />
                            <button onClick={() => remover(i)}>✕</button>
                        </div>
                    ))}

                    {preview.map((img, i) => (
                        <div className="imagem-card preview" key={`blob-${i}`}>
                            <img src={img} alt="" />
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
}
