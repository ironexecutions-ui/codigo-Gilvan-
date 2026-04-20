import React, { useState } from "react";
import "./headeradmin.css";

export default function HeaderAdmin({ funcionario, modo, setModo }) {

    const [mostrarModal, setMostrarModal] = useState(false);

    return (
        <>
            <header className="ha-header">

                <img
                    src={funcionario.foto}
                    alt="Foto do funcionário"
                    className="ha-foto"
                />

                <div className="ha-info">
                    <h2 className="ha-nome">
                        {funcionario.nome} {funcionario.sobrenome}
                    </h2>

                    <p
                        className="ha-funcao"
                        onClick={() => setMostrarModal(true)}
                    >
                        {funcionario.funcao}
                    </p>

                    {/* BOTÕES DE MODO */}
                    <div style={{ display: "none" }} className="ha-modos">
                        <button
                            className={`ha-botao ${modo === "servicos" ? "ativo" : ""}`}
                            onClick={() => setModo("servicos")}
                        >
                            Modo Serviços
                        </button>

                        <button
                            className={`ha-botao ${modo === "ib" ? "ativo" : ""}`}
                            onClick={() => setModo("ib")}
                        >
                            Modo IronBusiness
                        </button>
                    </div>
                </div>

            </header>

            {/* MODAL DE RESPONSABILIDADE */}
            {mostrarModal && (
                <div
                    className="ha-modal-overlay"
                    onClick={() => setMostrarModal(false)}
                >
                    <div
                        className="ha-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="ha-modal-titulo">Responsabilidade</h2>

                        <p className="ha-modal-texto">
                            {funcionario.responsabilidade}
                        </p>

                        <button
                            className="ha-modal-botao"
                            onClick={() => setMostrarModal(false)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
