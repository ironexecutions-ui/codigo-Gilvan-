import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import ModalEditarCliente from "./modaleditarcliente";
import "./controle.css";

export default function Controlee() {
    const [dados, setDados] = useState({
        administradores: [],
        supervisores: [],
        funcionarios: []
    });

    const [selecionado, setSelecionado] = useState(undefined);
    const cliente = JSON.parse(localStorage.getItem("cliente") || "{}");

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const token = localStorage.getItem("token");

        const resp = await fetch(`${API_URL}/controle/clientes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const json = await resp.json();
        setDados(json);
    }

    function podeAbrir(clienteLinha) {
        if (cliente.funcao !== "Administrador(a)") return;
        setSelecionado(clienteLinha);
    }

    function renderTabela(titulo, lista) {
        return (
            <div className="controle-bloco">
                <h3>{titulo}</h3>
                <button
                    className="controle-adicionar"
                    onClick={() => setSelecionado(null)}
                >
                    + Adicionar Funcionario
                </button>

                <table className="controle-tabela">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Nome completo</th>
                            <th>Cargo</th>
                            <th>Matrícula</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map(c => (
                            <tr
                                key={c.id}
                                className={cliente.funcao === "Administrador(a)" ? "clicavel" : ""}
                                onClick={() => podeAbrir(c)}
                            >
                                <td data-label="Email">{c.email}</td>
                                <td data-label="Nome completo">{c.nome_completo}</td>
                                <td data-label="Cargo">{c.cargo}</td>
                                <td data-label="Matrícula">{c.matricula}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="controle-container">
            {renderTabela("Administradores", dados.administradores)}
            {renderTabela("Supervisores", dados.supervisores)}
            {renderTabela("Funcionários", dados.funcionarios)}

            {(selecionado !== undefined) && (
                <ModalEditarCliente
                    cliente={selecionado}
                    fechar={() => setSelecionado(undefined)}
                    atualizar={carregar}
                />
            )}

        </div>
    );
}
