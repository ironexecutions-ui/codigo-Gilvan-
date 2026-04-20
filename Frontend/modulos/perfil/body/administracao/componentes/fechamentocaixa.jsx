import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import "./fechamentocaixa.css";

export default function FechamentoCaixa() {

    const [fechamentos, setFechamentos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarFechamentos();
    }, []);

    async function carregarFechamentos() {
        try {
            const token = localStorage.getItem("token");

            const resp = await fetch(`${API_URL}/caixa/fechamentos-empresa`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!resp.ok) {
                throw new Error("Erro ao buscar fechamentos");
            }

            const json = await resp.json();
            setFechamentos(json);

        } catch (err) {
            alert("Erro ao carregar fechamentos de caixa");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="fechamento-caixa-container">

            <h4>Fechamentos de Caixa</h4>

            {carregando && (
                <p className="fechamento-loading">
                    Carregando fechamentos...
                </p>
            )}

            {!carregando && fechamentos.length === 0 && (
                <p className="fechamento-vazio">
                    Nenhum fechamento registrado
                </p>
            )}

            {!carregando && fechamentos.length > 0 && (
                <div className="lista-fechamentos">
                    {fechamentos.map(f => (
                        <div
                            key={f.id}
                            className="item-fechamento"
                            onClick={() => window.open(f.link, "_blank")}
                        >
                            <strong>{f.nome_completo}</strong>
                            <span>
                                fechou caixa em {f.data} às {f.hora}
                            </span>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
