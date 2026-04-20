import React from "react";
import "./aulas.css";

import HeaderAulas from "./componentes/header/headeraulas";
import HeroAulas from "./componentes/hero/heroaulas";
import EstruturaCurso from "./componentes/estrutura/estruturacurso";
import PlanoCurso from "./componentes/plano/planocurso";
import FormularioCadastro from "./componentes/formulario/formulariocurso";

export default function Aulas() {
    return (
        <div className="aulas_container_geral">
            <HeaderAulas />
            <HeroAulas />
            <EstruturaCurso />
            <PlanoCurso />
            <FormularioCadastro />
        </div>
    );
}