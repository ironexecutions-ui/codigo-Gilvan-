import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";

import "./autorizacao.css";

export default function Autorizacao() {

    const [pendentes, setPendentes] = useState([]);
    const [autorizados, setAutorizados] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        setLoading(true);

        const p = await fetch(`${API_URL}/admin/autorizacao/pendentes`);
        const a = await fetch(`${API_URL}/admin/autorizacao/autorizados`);

        setPendentes(await p.json());
        setAutorizados(await a.json());

        setLoading(false);
    }

    async function autorizar(item) {
        await fetch(
            `${API_URL}/admin/autorizacao/autorizar?comercio_id=${item.comercio_cadastrado_id}&data=${item.data_solicitacao}`,
            { method: "PUT" }
        );
        carregar();
    }

    async function negar(item) {
        if (!window.confirm("Deseja negar esta solicitação?")) return;

        await fetch(
            `${API_URL}/admin/autorizacao/negar?comercio_id=${item.comercio_cadastrado_id}&data=${item.data_solicitacao}`,
            { method: "DELETE" }
        );
        carregar();
    }

    function abrirZap(celular, loja) {

        if (!celular) {
            alert("Número de WhatsApp não informado");
            return;
        }

        // remove tudo que não for número
        let numero = celular.replace(/\D/g, "");

        // se vier só com DDD + número, adiciona 55
        if (numero.length === 10 || numero.length === 11) {
            numero = "55" + numero;
        }

        const mensagem = encodeURIComponent(
            `Olá ${loja}, analisamos sua solicitação de módulos.`
        );

        const url = `https://wa.me/${numero}?text=${mensagem}`;

        window.open(url, "_blank");
    }


    if (loading) {
        return <div className="aut-loading">Carregando autorizações...</div>;
    }

    return (
        <div className="autorizacao-container">

            <section className="aut-bloco">
                <header className="aut-header">
                    <h2 className="aut-titulo pendente">Pendentes</h2>
                    <span className="aut-count">{pendentes.length}</span>
                </header>

                {pendentes.length === 0 && (
                    <p className="aut-vazio">Nenhuma solicitação pendente</p>
                )}

                {pendentes.map((p, i) => (
                    <Card
                        key={i}
                        item={p}
                        status="pendente"
                        autorizar={autorizar}
                        negar={negar}
                        zap={abrirZap}
                    />
                ))}
            </section>

            <section className="aut-bloco">
                <header className="aut-header">
                    <h2 className="aut-titulo autorizado">Autorizados</h2>
                    <span className="aut-count">{autorizados.length}</span>
                </header>

                {autorizados.length === 0 && (
                    <p className="aut-vazio">Nenhum módulo autorizado</p>
                )}

                {autorizados.map((a, i) => (
                    <Card
                        key={i}
                        item={a}
                        status="autorizado"
                        zap={abrirZap}
                    />
                ))}
            </section>

        </div>
    );
}

function Card({ item, status, autorizar, negar, zap }) {
    return (
        <div className={`aut-card ${status}`}>

            <div className="aut-card-imagem">
                <img
                    src={item.imagem || "/placeholder.png"}
                    alt={item.loja}
                />
                <span className={`aut-badge ${status}`}>
                    {status}
                </span>
            </div>

            <div className="aut-card-info">
                <span className="aut-loja">{item.loja}</span>
                <span className="aut-modulos">{item.modulos}</span>
                <span className="aut-data">Solicitado em {item.data_solicitacao}</span>
            </div>

            <div className="aut-card-acoes">
                <button
                    className="aut-btn zap"
                    onClick={() => zap(item.celular, item.loja)}
                >
                    WhatsApp
                </button>

                {status === "pendente" && (
                    <>
                        <button
                            className="aut-btn ok"
                            onClick={() => autorizar(item)}
                        >
                            Autorizar
                        </button>

                        <button
                            className="aut-btn no"
                            onClick={() => negar(item)}
                        >
                            Negar
                        </button>
                    </>
                )}
            </div>

        </div>
    );
}
