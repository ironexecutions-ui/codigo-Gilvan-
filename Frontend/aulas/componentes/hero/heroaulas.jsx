import React from "react";
import "./heroaulas.css";

export default function HeroAulas() {
    return (
        <section className="heroAulas_container">

            <div className="heroAulas_content">

                <span className="heroAulas_badge">
                    Curso para iniciantes
                </span>

                <h1 className="heroAulas_titulo">
                    Aprenda programação do zero e comece a criar sites reais
                </h1>

                <p className="heroAulas_subtitulo">
                    Mesmo que você nunca tenha programado antes, você vai aprender
                    passo a passo com acompanhamento real até conseguir criar sozinho.
                </p>

                <div className="heroAulas_ctaArea">

                    <a href="#formulario" className="heroAulas_botaoPrincipal">
                        Garantir minha vaga
                    </a>

                    <span className="heroAulas_infoExtra">
                        Turmas pequenas, acompanhamento individual
                    </span>

                </div>

            </div>

        </section>
    );
}