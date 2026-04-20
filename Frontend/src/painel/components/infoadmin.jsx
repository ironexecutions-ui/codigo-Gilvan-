import React from "react";
import "./infoadmin.css";
import { useNavigate } from "react-router-dom";

export default function InfoAdmin() {

    const navigate = useNavigate();

    return (
        <div className="ia-box">

            <h2 className="ia-titulo">Informações</h2>

            <button
                className="ia-botao"
                onClick={() => navigate("/clientes")}
            >
                Tabela Clientes
            </button>

            <button
                className="ia-botao"
                onClick={() => navigate("/funcionarios")}
            >
                Sócios Executivos
            </button>

            <button
                className="ia-botao"
                onClick={() => navigate("/dados")}
            >
                Contratos            </button>
            <button
                className="ia-botao"
                onClick={() => window.open("/cadastrocomercio", "_blank")}
            >
                Cadastrar novo sistema            </button>
            <button
                className="ia-botao"
                onClick={() => window.open("/ferramentas", "_blank")}
            >
                ferramentas
            </button>
        </div>
    );
}
