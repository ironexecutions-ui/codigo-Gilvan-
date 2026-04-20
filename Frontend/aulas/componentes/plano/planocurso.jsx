import React from "react";
import "./planocurso.css";

export default function PlanoCurso() {
    return (
        <section className="planoCurso_container">

            <h2 className="planoCurso_titulo">
                Estrutura completa do curso
            </h2>

            <p className="planoCurso_subtitulo">
                Um método prático, com acompanhamento real para você aprender do zero
            </p>

            <div className="planoCurso_card">

                <div className="planoCurso_topo">
                    <span className="planoCurso_label">
                        Aulas ao vivo via Zoom
                    </span>

                    <p className="planoCurso_preco">
                        R$300<span className="planoCurso_mes">/mês</span>
                    </p>
                </div>

                <ul className="planoCurso_lista">

                    <li>
                        ✔ 2 aulas por semana (1h30 + 2h)
                    </li>

                    <li>
                        ✔ Turmas reduzidas, máximo de 6 alunos
                    </li>

                    <li>
                        ✔ Mentoria individual mensal de 45 minutos
                    </li>

                    <li>
                        ✔ Acompanhamento direto durante o aprendizado
                    </li>

                    <li>
                        ✔ Horários definidos no início com a turma
                    </li>

                    <li>
                        ✔ Sistema exclusivo para acompanhar seu progresso
                    </li>

                    <li>
                        ✔ A partir de 14 anos
                    </li>

                </ul>



                <span className="planoCurso_aviso">
                    Início na primeira semana de abril • Vagas limitadas
                </span>

            </div>

        </section>
    );
}