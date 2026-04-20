import React from "react";
import HeaderAdmin from "../headeradmin";
import FuncionariosAdmin from "./rotas/funcionariosadmin";
import "./funcionariospage.css";

export default function FuncionariosPage() {

    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    return (
        <div className="funcionarios-page">

            <HeaderAdmin funcionario={funcionario} />

            <div className="funcionarios-content">
                <FuncionariosAdmin />
            </div>

        </div>
    );
}
