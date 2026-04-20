import React, { useEffect, useState } from "react";
import Controlee from "./componentes/controle";
import "./menucontrole.css";
import ProdutosComercio from "./componentes/produtoscomercio";

export default function Controle() {
    const [abaAtiva, setAbaAtiva] = useState("produtos");
    const cliente = JSON.parse(localStorage.getItem("cliente") || "{}");
    const isAdmin = cliente.funcao === "Administrador(a)";

    useEffect(() => {
        setAbaAtiva("produtos");
    }, []);

    return (
        <div className="menu-controle-container">

            {/* ===== BOTÕES ===== */}
            <div className="menu-controle-botoes">
                {isAdmin && (
                    <button
                        className={abaAtiva === "tabelas" ? "menu-controle-btn ativo" : "menu-controle-btn"}
                        onClick={() => setAbaAtiva("tabelas")}
                    >
                        Funcionários
                    </button>
                )}

                <button
                    className={abaAtiva === "produtos" ? "menu-controle-btn ativo" : "menu-controle-btn"}
                    onClick={() => setAbaAtiva("produtos")}
                >
                    Produtos
                </button>

                {/* FUTUROS BOTÕES
                <button
                    className={abaAtiva === "outro" ? "menu-controle-btn ativo" : "menu-controle-btn"}
                    onClick={() => setAbaAtiva("outro")}
                >
                    Outro módulo
                </button>
                */}
            </div>

            {/* ===== CONTEÚDO ===== */}
            <div className="menu-controle-conteudo">
                {abaAtiva === "tabelas" && <Controlee />}
                {abaAtiva === "produtos" && <ProdutosComercio />}
            </div>


        </div>
    );
}
