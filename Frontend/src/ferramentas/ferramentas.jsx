import React, { useState } from "react";
import PaletaCores from "./componentes/paletacores";
import Anotacoes from "./componentes/anotacoes";

import './ferramentas.css'

export default function Ferramentas() {

    const [ferramentaAtiva, setFerramentaAtiva] = useState("anotacoes");

    function renderizarFerramenta() {
        if (ferramentaAtiva === "paleta") {
            return <PaletaCores />;
        }
        if (ferramentaAtiva === "anotacoes") {
            return <Anotacoes />;
        }
        return (
            <p className="ferr-mensagem">
                Selecione uma ferramenta acima
            </p>
        );
    }

    return (
        <main className="ferr-main">

            {/* Área de botões */}
            <div className="ferr-botoes">
                <button className="ferr-botao" onClick={() => setFerramentaAtiva("paleta")}>
                    Paleta de cores
                </button>
                <button className="ferr-botao" onClick={() => setFerramentaAtiva("anotacoes")}>
                    anotações
                </button>
            </div>

            {/* Área de conteúdo */}
            <section className="ferr-conteudo">
                {renderizarFerramenta()}
            </section>

        </main>
    );
}
