import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../config";
import "./clientes_exibicao.css";

export default function Funcionarios() {

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    const [loja, setLoja] = useState("");
    const [dados, setDados] = useState({
        "Administrador(a)": [],
        "Supervisor(a)": [],
        "Funcionario(a)": []
    });

    async function carregar() {

        if (!usuario.comercio_id) return;

        try {
            const resp = await fetch(
                `${API_URL}/exibicao/funcionarios/${usuario.comercio_id}`
            );

            const json = await resp.json();

            setLoja(json.loja);
            setDados({
                "Administrador(a)": json["Administrador(a)"] || [],
                "Supervisor(a)": json["Supervisor(a)"] || [],
                "Funcionario(a)": json["Funcionario(a)"] || []
            });
        } catch (e) {
            console.log("Erro ao carregar funcionários", e);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    return (
        <div className="funcionarios-container">
            <div className="colunas">

                <div className="coluna">
                    <h2>Administradores</h2>
                    {dados["Administrador(a)"].map((p, i) => (
                        <div className="pessoa" key={i}>
                            <strong>{p.nome}</strong>
                            <span>{p.cargo}</span>
                        </div>
                    ))}
                </div>

                <div className="coluna">
                    <h2>Supervisores</h2>
                    {dados["Supervisor(a)"].map((p, i) => (
                        <div className="pessoa" key={i}>
                            <strong>{p.nome}</strong>
                            <span>{p.cargo}</span>
                        </div>
                    ))}
                </div>

                <div className="coluna">
                    <h2>Funcionários</h2>
                    {dados["Funcionario(a)"].map((p, i) => (
                        <div className="pessoa" key={i}>
                            <strong>{p.nome}</strong>
                            <span>{p.cargo}</span>
                        </div>
                    ))}
                </div>

            </div>

        </div>
    );
}
