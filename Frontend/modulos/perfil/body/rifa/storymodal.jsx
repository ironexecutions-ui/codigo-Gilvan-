import React from "react";
import "./storymodal.css";

export default function StoryModal({ rifa, compras, onClose }) {
    const [inicio, fim] = rifa.numeros.split("-").map(Number);
    const comprados = new Set(compras.map(c => c.numero));

    return (
        <div className="story-overlay">
            <div className="story-modal">

                <button
                    className="story-close"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    ×
                </button>

                {/* LOGO */}
                {rifa.imagem_loja && (
                    <div className="story-logo-wrap">
                        <img src={rifa.imagem_loja} alt="logo" />
                    </div>
                )}

                {/* LOJA */}
                <h1 className="story-loja">{rifa.loja}</h1>

                {/* CARD */}
                <div className="story-card">

                    {/* FOTOS */}
                    <div className="story-fotos">
                        {(rifa.fotos || "")
                            .split("|")
                            .map(f => f.replace(/\?$/, "").trim())
                            .filter(f => f.startsWith("http"))
                            .slice(0, 3)
                            .map((f, i) => (
                                <img
                                    key={i}
                                    src={f}
                                    alt={`foto-${i}`}
                                />
                            ))}
                    </div>

                    <h2 className="story-premio">
                        Prêmio: {rifa.premio}
                    </h2>

                    <p className="story-data">
                        Finaliza {new Date(rifa.data_fim).toLocaleString("pt-BR")}
                    </p>
                </div>

                {/* GRID */}
                <div className="story-grid">
                    {Array.from({ length: fim - inicio + 1 }).map((_, i) => {
                        const n = inicio + i;
                        const vendido = comprados.has(n);

                        return (
                            <div
                                key={n}
                                className={`story-numero ${vendido ? "vendido" : ""}`}
                            >
                                {n}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
