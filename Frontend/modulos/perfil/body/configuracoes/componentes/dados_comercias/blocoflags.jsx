import React, { useState } from "react";
import { URL } from "../../../url";
import "./blocoflags.css";

export default function BlocoFlags({ dados, podeEditar, salvar }) {

    const [converteLocal, setConverteLocal] = useState(dados.converte || 0);
    const [cambioLocal, setCambioLocal] = useState(dados.cambio || 0);

    async function atualizarCambio(novoConverte, novoCambio) {
        try {
            const token = localStorage.getItem("token");

            await fetch(`${URL}/comercio/cambio`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    converte: novoConverte,
                    cambio: novoCambio
                })
            });

        } catch (e) {
            console.log("Erro ao atualizar cambio", e);
        }
    }

    return (
        <div className="bf-container">

            <h2 className="bf-titulo">Configurações internas</h2>

            <div className="bf-lista">

                {/* ================= CONVERSÃO ================= */}
                <div className="bf-item">
                    <label className="bf-label">
                        Permitir conversão de moeda
                    </label>
                    <br />
                    <select
                        className="bf-select"
                        disabled={!podeEditar}
                        value={converteLocal}
                        onChange={e => {
                            const valor = Number(e.target.value);
                            setConverteLocal(valor);
                            atualizarCambio(valor, cambioLocal);
                        }}
                    >
                        <option value={0}>Não</option>
                        <option value={1}>Sim</option>
                    </select>
                </div>

                {/* CAMPO CAMBIO APENAS SE CONVERTE = 1 */}
                {converteLocal === 1 && (
                    <div className="bf-item">
                        <label className="bf-label">
                            Valor do câmbio
                        </label>
                        <br />
                        <input
                            type="number"
                            step="0.01"
                            className="bf-select"
                            disabled={!podeEditar}
                            value={cambioLocal}
                            onChange={e => {
                                const valor = Number(e.target.value);
                                setCambioLocal(valor);
                                atualizarCambio(converteLocal, valor);
                            }}
                        />
                    </div>
                )}

                {/* ================= RESTANTE DO SEU CÓDIGO ================= */}

                <div className="bf-item">
                    <label className="bf-label">
                        Permitir funcionários editarem preços
                    </label>
                    <br />
                    <select
                        className="bf-select"
                        disabled={!podeEditar}
                        value={dados.editar_preco}
                        onChange={e =>
                            salvar("editar_preco", Number(e.target.value))
                        }
                    >
                        <option value={0}>Não</option>
                        <option value={1}>Sim</option>
                    </select>
                </div>

                <div className="bf-item">
                    <label className="bf-label">
                        Impressão automática da comanda
                    </label>
                    <br />
                    <select
                        className="bf-select"
                        disabled={!podeEditar}
                        value={dados.node}
                        onChange={e =>
                            salvar("node", Number(e.target.value))
                        }
                    >
                        <option value={0}>Inativo</option>
                        <option value={1}>Ativo</option>
                    </select>
                </div>

                <div className="bf-item">
                    <label className="bf-label">
                        Conectar maquininha automaticamente
                    </label>
                    <br />
                    <select
                        className="bf-select"
                        disabled={!podeEditar}
                        value={dados.api}
                        onChange={e =>
                            salvar("api", Number(e.target.value))
                        }
                    >
                        <option value={0}>Não</option>
                        <option value={1}>Sim</option>
                    </select>
                </div>

            </div>
        </div>
    );
}