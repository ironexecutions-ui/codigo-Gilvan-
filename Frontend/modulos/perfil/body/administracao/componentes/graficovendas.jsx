import React, { useState } from "react";
import "./graficovendas.css"
import GraficoPizzaProdutos from "./graficos/graficopizzaprodutos";
import GraficoBarrasProdutos from "./graficos/graficolinhasvendas";
import GraficoLinhasVendas from "./graficos/graficobarrasprodutos";

export default function GraficosVendas() {

    const [graficoAtivo, setGraficoAtivo] = useState("pizza");

    function renderizarGrafico() {
        if (graficoAtivo === "pizza") return <GraficoPizzaProdutos />;
        if (graficoAtivo === "barras") return <GraficoBarrasProdutos />;
        if (graficoAtivo === "linhas") return <GraficoLinhasVendas />;
        return null;
    }

    return (
        <div className="graficos-vendas-container">
            <h4>Gráficos de Vendas</h4>

            <div className="graficos-vendas-botoes">
                <button
                    className={graficoAtivo === "pizza" ? "ativo" : ""}
                    onClick={() => setGraficoAtivo("pizza")}
                >
                    Produtos Vendidos (%)
                </button>

                <button
                    className={graficoAtivo === "barras" ? "ativo" : ""}
                    onClick={() => setGraficoAtivo("barras")}
                > Evolução de Vendas
                </button>

                <button
                    className={graficoAtivo === "linhas" ? "ativo" : ""}
                    onClick={() => setGraficoAtivo("linhas")}
                >
                    Ganhos correspondentes
                </button>
            </div>

            <div className="graficos-vendas-conteudo">
                {renderizarGrafico()}
            </div>
        </div>
    );

}
