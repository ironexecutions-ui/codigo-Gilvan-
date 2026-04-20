import React, { useState } from "react";
import "./contagem.css";
import VendasComercios from "./contagem/vendascomercios";

export default function Contagem() {
    const [tela, setTela] = useState(null);

    return (
        <div className="contagem-container">

            {/* MENU LATERAL */}
            <aside className="menu-lateral">
                <div
                    className={`menu-item ${tela === "vendas" ? "ativo" : ""}`}
                    onClick={() => setTela("vendas")}
                >
                    <span className="menu-icone">📊</span>
                    <span className="menu-texto">Vendas por comércio</span>
                </div>

                <div className="menu-item bloqueado">
                    <span className="menu-icone">➕</span>
                    <span className="menu-texto">Em breve</span>
                </div>

                <div className="menu-item bloqueado">
                    <span className="menu-icone">➕</span>
                    <span className="menu-texto">Em breve</span>
                </div>
            </aside>

            {/* CONTEÚDO */}
            <main className="conteudo">
                {!tela && (
                    <div className="conteudo-vazio">
                        <h1>Contagem & Controle</h1>
                        <p>Selecione uma opção no menu lateral para começar.</p>
                    </div>
                )}

                {tela === "vendas" && <VendasComercios />}
            </main>
        </div>
    );
}
