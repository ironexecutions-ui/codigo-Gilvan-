import React, { useEffect, useState } from "react";
import "./servicosadmin.css";
import { API_URL } from "../../../config";

export default function ServicosAdmin() {

    const [servicos, setServicos] = useState([]);
    const [filtro, setFiltro] = useState("total");

    async function carregarServicos() {
        try {
            const resp = await fetch(`${API_URL}/servicos`);
            const dados = await resp.json();
            setServicos(dados);
        } catch (err) {
            console.log("Erro ao carregar serviços", err);
        }
    }

    useEffect(() => {
        carregarServicos();
    }, []);

    async function mudarProcesso(id, novoProcesso) {
        try {
            await fetch(`${API_URL}/servicos/processo/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ processo: novoProcesso })
            });
            carregarServicos();
        } catch (err) {
            console.log("Erro ao mudar processo", err);
        }
    }

    const listaFiltrada = filtro === "total"
        ? servicos
        : servicos.filter(s => s.processo === filtro);

    const totalContratacao = servicos.filter(s => s.processo === "contratacao").length;
    const totalAndamento = servicos.filter(s => s.processo === "andamento").length;
    const totalFinalizados = servicos.filter(s => s.processo === "finalizado").length;
    const totalGeral = servicos.length;

    return (
        <div className="sa-box">

            <h2 className="sa-titulo">Serviços</h2>

            <div className="sa-botoes">
                <button onClick={() => setFiltro("contratacao")}>
                    Contratação ({totalContratacao})
                </button>

                <button onClick={() => setFiltro("andamento")}>
                    Em andamento ({totalAndamento})
                </button>

                <button onClick={() => setFiltro("finalizado")}>
                    Finalizados ({totalFinalizados})
                </button>

                <button onClick={() => setFiltro("total")}>
                    Total ({totalGeral})
                </button>
            </div>

            <div className="sa-lista">
                {listaFiltrada.length === 0 && (
                    <p className="sa-vazio">Nenhum serviço encontrado</p>
                )}

                {listaFiltrada.map(item => (
                    <div className="sa-item" key={item.id}>
                        <p>
                            <strong>Cliente:</strong> {item.cliente}
                        </p>
                        <p>
                            <strong>Loja:</strong> {item.loja}
                        </p>
                        <p>
                            <strong>Valor:</strong> R$ {item.valor}
                        </p>
                        <p>
                            <a href={item.link} target="_blank" rel="noreferrer">
                                Abrir link
                            </a>
                        </p>

                        {filtro !== "total" && (
                            <>
                                {item.processo === "contratacao" && (
                                    <button
                                        className="sa-avancar"
                                        onClick={() => mudarProcesso(item.id, "andamento")}
                                    >
                                        Mover para andamento
                                    </button>
                                )}

                                {item.processo === "andamento" && (
                                    <button
                                        className="sa-avancar"
                                        onClick={() => mudarProcesso(item.id, "finalizado")}
                                    >
                                        Finalizar serviço
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
