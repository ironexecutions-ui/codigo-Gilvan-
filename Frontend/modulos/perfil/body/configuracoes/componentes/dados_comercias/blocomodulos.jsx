import React, { useEffect, useState } from "react";
import "./blocomodulos.css";
import { URL } from "../../../url";

export default function BlocoModulos({ comercioId, podeEditar }) {

    const [modulos, setModulos] = useState([]);
    const token = localStorage.getItem("token");

    // ===============================
    // CARREGAR MÓDULOS DO COMÉRCIO
    // ===============================
    useEffect(() => {
        if (!comercioId) {
            setModulos([]);
            return;
        }

        let ativo = true;

        async function carregar() {
            try {
                setModulos([]); // limpa estado antigo

                const res = await fetch(
                    `${URL}/modulos/empresa/${comercioId}`,
                    {
                        headers: {
                            Authorization: "Bearer " + token
                        }
                    }
                );

                const json = await res.json();

                if (ativo) {
                    setModulos(json);
                }
            } catch (e) {
                if (ativo) {
                    setModulos([]);
                }
            }
        }

        carregar();

        return () => {
            ativo = false; // evita setState tardio
        };
    }, [comercioId, token]);

    // ===============================
    // SOLICITAR MÓDULO
    // ===============================
    async function solicitar(modulo) {
        try {
            await fetch(`${URL}/modulos/solicitar`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    comercio_id: comercioId,
                    modulo
                })
            });

            // recarrega após solicitar
            await carregarSeguro();
        } catch {
            // erro silencioso por enquanto
        }
    }

    // ===============================
    // RECARREGAR COM SEGURANÇA
    // ===============================
    async function carregarSeguro() {
        try {
            const res = await fetch(
                `${URL}/modulos/empresa/${comercioId}`,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const json = await res.json();
            setModulos(json);
        } catch {
            setModulos([]);
        }
    }

    return (
        <div className="bm-container">

            <h2 className="bm-titulo">Módulos</h2>

            <div className="bm-lista">
                {modulos.map(m => (
                    <div key={m.modulo} className="bm-item">

                        <div className="bm-clas">
                            <span className="bm-nome">{m.modulo}</span>
                            <span className="bm-descricao">{m.descricao}</span>
                        </div>

                        <div className="bm-acao">

                            {m.ativo === null && (
                                podeEditar ? (
                                    <button
                                        className="bm-btn bm-btn-solicitar"
                                        onClick={() => solicitar(m.modulo)}
                                    >
                                        Solicitar
                                    </button>
                                ) : (
                                    <span className="bm-status bm-inativo">
                                        Inativo
                                    </span>
                                )
                            )}

                            {m.ativo === 0 && (
                                <span className="bm-status bm-solicitado">
                                    Solicitado
                                </span>
                            )}

                            {m.ativo === 1 && (
                                <span className="bm-status bm-ativo">
                                    Ativo
                                </span>
                            )}

                        </div>

                    </div>
                ))}

                {modulos.length === 0 && (
                    <div className="bm-vazio">
                        Nenhum módulo encontrado
                    </div>
                )}
            </div>

        </div>
    );
}
