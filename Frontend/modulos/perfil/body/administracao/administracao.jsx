import React, { useEffect, useState } from "react";
import "./administracao.css";
import GraficosVendas from "./componentes/graficovendas";
import AnaliseProdutos from "./componentes/analiseprodutos";
import ResumoProdutos from "./componentes/resumoprodutos";
import HistoricoVendas from "./componentes/historicovendas";
import FechamentoCaixa from "./componentes/fechamentocaixa";
import { API_URL } from "../../../../config";

export default function Administracao() {
    const [abaAtiva, setAbaAtiva] = useState("resumo");
    const [mostrarParceria, setMostrarParceria] = useState(false);

    useEffect(() => {
        async function verificarComercio() {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch(`${API_URL}/retorno/me`, {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const cliente = await res.json();

                if ([25, 11, 28].includes(cliente?.comercio_id)) {
                    setMostrarParceria(true);
                }
            } catch (err) {
                console.error("Erro ao verificar comercio_id", err);
            }
        }

        verificarComercio();
    }, []);

    function irParaParceria() {
        window.open(
            "https://ironexecutions.com.br/parceria",
            "_blank",
            "noopener,noreferrer"
        );
    }


    return (
        <div className="administracao-container">
            <h3>Área de Administração</h3>

            <div className="administracao-botoes">
                <button
                    className={abaAtiva === "graficos" ? "ativo" : ""}
                    onClick={() => setAbaAtiva("graficos")}
                >
                    Gráficos
                </button>

                <button
                    className={abaAtiva === "analise" ? "ativo" : ""}
                    onClick={() => setAbaAtiva("analise")}
                >
                    Análise de Produtos
                </button>

                <button
                    className={abaAtiva === "resumo" ? "ativo" : ""}
                    onClick={() => setAbaAtiva("resumo")}
                >
                    Lista Produtos
                </button>

                <button
                    className={abaAtiva === "historico" ? "ativo" : ""}
                    onClick={() => setAbaAtiva("historico")}
                >
                    Histórico de Vendas
                </button>

                <button
                    className={abaAtiva === "fechamento" ? "ativo" : ""}
                    onClick={() => setAbaAtiva("fechamento")}
                >
                    Fechamento de Caixa
                </button>

                {mostrarParceria && (
                    <button
                        className="btn-parceria"
                        onClick={irParaParceria}
                    >
                        Parceria
                    </button>
                )}
            </div>

            <div className="administracao-conteudo">
                {abaAtiva === "graficos" && <GraficosVendas />}
                {abaAtiva === "analise" && <AnaliseProdutos />}
                {abaAtiva === "resumo" && <ResumoProdutos />}
                {abaAtiva === "historico" && <HistoricoVendas />}
                {abaAtiva === "fechamento" && <FechamentoCaixa />}
            </div>
        </div>
    );
}
