import React, { useEffect, useState } from "react";

import DadosComerciais from "./componentes/dados_comerciais";
import DadosPessoais from "./componentes/dados_pessoais";
import { URL } from "../url";
import "./configuracoes.css";

export default function Configuracoes() {

    const [abaAtiva, setAbaAtiva] = useState("pessoais");
    const [funcao, setFuncao] = useState(null);

    useEffect(() => {
        async function carregar() {
            try {
                const token = localStorage.getItem("token");

                const resp = await fetch(`${URL}/clientes/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const json = await resp.json();
                setFuncao(json.funcao);
            } catch {
                setFuncao(null);
            }
        }

        carregar();
    }, []);

    function renderizarConteudo() {
        if (abaAtiva === "comerciais") {
            return <DadosComerciais />;
        }

        if (abaAtiva === "pessoais") {
            return <DadosPessoais />;
        }

        return null;
    }

    return (
        <div className="configuracoes-container">

            <div className="configuracoes-tabs">

                {funcao !== "Funcionario(a)" && funcao !== "Supervisor(a)" && (
                    <button
                        className={`configuracoes-tab ${abaAtiva === "comerciais" ? "ativa" : ""}`}
                        onClick={() => setAbaAtiva("comerciais")}
                    >
                        Dados comerciais
                    </button>
                )}


                <button
                    className={`configuracoes-tab ${abaAtiva === "pessoais" ? "ativa" : ""}`}
                    onClick={() => setAbaAtiva("pessoais")}
                >
                    Alterar senha
                </button>
            </div>

            <div className="configuracoes-conteudo">
                {renderizarConteudo()}
            </div>

        </div>
    );
}
