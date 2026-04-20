import React from "react";
import "./headeraulas.css";

export default function HeaderAulas() {

    function scrollParaFormulario(e) {
        e.preventDefault();

        const elemento = document.getElementById("formulario");

        if (elemento) {
            const offset = 80; // altura do header (ajuste se precisar)

            const posicao =
                elemento.getBoundingClientRect().top +
                window.pageYOffset -
                offset;

            window.scrollTo({
                top: posicao,
                behavior: "smooth"
            });
        }
    }

    return (
        <header className="headerAulas_container">

            <div className="headerAulas_logoArea">

                <img
                    src="https://mtljmvivztkgoolnnwxc.supabase.co/storage/v1/object/public/assinaturas/ironbusiness/0046c2f2-0b3c-48a8-b51b-8ba095289f3b.png"
                    alt="Iron Execution"
                    className="headerAulas_logoImagem"
                />

                <div className="headerAulas_textos">
                    <span className="headerAulas_titulo">
                        Iron Execution
                    </span>

                    <span className="headerAulas_subtitulo">
                        Formação prática em programação
                    </span>
                </div>

            </div>

            <a
                href="#formulario"
                onClick={scrollParaFormulario}
                className="headerAulas_botao"
            >
                Garantir vaga
            </a>

        </header>
    );
}