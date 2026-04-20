import React, { useRef, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { API_URL } from "../../config";

export default function AssinaturaCanvas({ idContrato, tipo, onFinalizado, assinaturaExistente }) {

    const canvasRef = useRef(null);
    const [desenhando, setDesenhando] = useState(false);

    // ======================================================
    // Impedir o celular de rolar quando estiver assinando
    // ======================================================
    useEffect(() => {
        const preventScroll = (e) => {
            if (desenhando) e.preventDefault();
        };

        document.addEventListener("touchmove", preventScroll, { passive: false });
        return () => document.removeEventListener("touchmove", preventScroll);
    }, [desenhando]);

    // ======================================================
    // Função para começar o desenho
    // ======================================================
    function iniciar(e) {
        setDesenhando(true);
        desenhar(e);
    }

    function parar() {
        setDesenhando(false);
        const ctx = canvasRef.current.getContext("2d");
        ctx.beginPath();
    }

    function desenhar(e) {
        if (!desenhando) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();

        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;

        // ======== CÁLCULO DE ESCALA DO CANVAS ========
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        // =============================================

        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }


    // converter base64 para Blob
    function base64ToBlob(base64) {
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: "image/png" });
    }

    // LIMPAR A ASSINATURA
    function limparCanvas() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // SALVAR ASSINATURA
    async function salvar() {
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL("image/png");
        const base64 = dataURL.split(",")[1];
        const blob = base64ToBlob(base64);

        const nomeArquivo = `assinatura_${tipo}_${idContrato}_${Date.now()}.png`;

        // upload
        const { error } = await supabase.storage
            .from("assinaturas")
            .upload(nomeArquivo, blob, {
                contentType: "image/png",
                upsert: false
            });

        if (error) {
            console.log("Erro Supabase:", error);
            return;
        }

        const urlPublica =
            `https://mtljmvivztkgoolnnwxc.supabase.co/storage/v1/object/public/assinaturas/${nomeArquivo}`;

        await fetch(
            `${API_URL}/contratos/salvar-assinatura?id_contrato=${idContrato}&tipo=${tipo}&url=${urlPublica}`,
            { method: "POST" }
        );

        onFinalizado(urlPublica);
    }

    return (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>

            {/* CANVAS ACIMA DA LINHA */}
            <canvas
                ref={canvasRef}
                width={450}
                height={160}
                style={{
                    border: "1px solid #ccc",
                    background: "white",
                    borderRadius: "6px"
                }}
                onMouseDown={iniciar}
                onMouseUp={parar}
                onMouseMove={desenhar}
                onTouchStart={iniciar}
                onTouchEnd={parar}
                onTouchMove={desenhar}
            />

            <div style={{ display: "flex", gap: "10px" }}>
                <button
                    onClick={limparCanvas}
                    style={{
                        padding: "8px 18px",
                        background: "#b60000",
                        border: "none",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Limpar
                </button>

                <button
                    onClick={salvar}
                    style={{
                        padding: "8px 18px",
                        background: "#0b1f3d",
                        border: "none",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Salvar assinatura
                </button>
            </div>
        </div>
    );
}
