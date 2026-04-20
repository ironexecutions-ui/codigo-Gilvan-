import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
} from "chart.js";

import { API_URL } from "../../../../../../config";
import "./graficobarrasprodutos.css";

ChartJS.register(
    BarElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
);

export default function GraficoGanhos() {

    const [periodo, setPeriodo] = useState("dias");
    const [dados, setDados] = useState([]);
    const [detalhes, setDetalhes] = useState([]);
    const [produtosSemPreco, setProdutosSemPreco] = useState(0);
    const [produtosSemCusto, setProdutosSemCusto] = useState(0);

    const [carregando, setCarregando] = useState(true);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [labelSelecionado, setLabelSelecionado] = useState(null);

    const token = localStorage.getItem("token");

    /* ===============================
       BUSCAR DADOS DO GRÁFICO
    =============================== */
    useEffect(() => {
        async function carregar() {
            setCarregando(true);
            setDados([]);
            setDetalhes([]);
            setLabelSelecionado(null);

            const resp = await fetch(
                `${API_URL}/admin/graficos/ganhos?periodo=${periodo}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (resp.ok) {
                const json = await resp.json();
                setDados(json.dados || []);
                setProdutosSemPreco(json.sem_preco || 0);
                setProdutosSemCusto(json.sem_custo || 0);
            }

            setCarregando(false);
        }

        carregar();
    }, [periodo]);

    /* ===============================
       ABRIR DETALHES (DRILLDOWN)
    =============================== */
    async function abrirDetalhes(index) {
        const item = dados[index];
        if (!item) return;

        setLabelSelecionado(item.label);
        setCarregandoDetalhes(true);
        setDetalhes([]);

        const resp = await fetch(
            `${API_URL}/admin/graficos/ganhos/detalhes?label=${item.label}&periodo=${periodo}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (resp.ok) {
            const json = await resp.json();
            setDetalhes(json);
        }

        setCarregandoDetalhes(false);
    }

    /* ===============================
       PDF DO PERÍODO (COM TOKEN)
    =============================== */
    async function baixarPDFPeriodo() {
        if (!labelSelecionado) return;

        const resp = await fetch(
            `${API_URL}/admin/graficos/ganhos/pdf?label=${labelSelecionado}&periodo=${periodo}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resp.ok) return;

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `ganhos_${labelSelecionado}.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
    }

    /* ===============================
       PDF PRODUTOS SEM PREÇO
    =============================== */
    async function baixarPDFSemPreco() {
        const resp = await fetch(
            `${API_URL}/admin/graficos/ganhos/pdf-sem-preco`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resp.ok) return;

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `produtos_sem_preco.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
    }
    async function baixarPDFSemCusto() {
        const resp = await fetch(
            `${API_URL}/admin/graficos/ganhos/pdf-sem-custo`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resp.ok) return;

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `produtos_sem_custo.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
    }

    /* ===============================
       CONFIG DO GRÁFICO
    =============================== */
    const chartData = {
        labels: dados.map(d => d.label),
        datasets: [
            {
                label: "Ganho (R$)",
                data: dados.map(d => d.ganho),
                backgroundColor: "rgba(34,197,94,0.6)",
                hoverBackgroundColor: "rgba(34,197,94,0.9)",
                borderRadius: 10,
                barThickness: 36
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_, elements) => {
            if (elements.length > 0) {
                abrirDetalhes(elements[0].index);
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: "#e5e7eb",
                    font: { size: 12 }
                }
            },
            tooltip: {
                callbacks: {
                    label: ctx => `R$ ${ctx.raw.toFixed(2)}`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: "#94a3b8" },
                grid: { display: false }
            },
            y: {
                ticks: { color: "#94a3b8" },
                grid: { color: "rgba(148,163,184,0.12)" }
            }
        }
    };

    return (
        <div className="grafico-ganhos-container">

            {/* ALERTA */}
            {produtosSemPreco > 0 && (
                <div className="alerta-sem-preco">
                    ⚠️ Existem <strong>{produtosSemPreco}</strong> produtos sem preço registrado.
                    <button onClick={baixarPDFSemPreco}>
                        Baixar lista em PDF
                    </button>
                </div>
            )}
            {produtosSemCusto > 0 && (
                <div className="alerta-sem-custo">
                    ⚠️ Existem <strong>{produtosSemCusto}</strong> produtos com custo zerado.
                    <button onClick={baixarPDFSemCusto}>
                        Baixar lista em PDF
                    </button>
                </div>
            )}


            {/* TOPO */}
            <div className="grafico-ganhos-topo">
                <button onClick={() => setPeriodo("dias")}>10 Dias</button>
                <button onClick={() => setPeriodo("semanas")}>10 Semanas</button>
                <button onClick={() => setPeriodo("quincenas")}>10 Quincenas</button>
                <button onClick={() => setPeriodo("meses")}>10 Meses</button>
            </div>

            {/* GRÁFICO */}
            <div className="grafico-ganhos-conteudo">
                {carregando && <span className="grafico-loading">Carregando ganhos…</span>}

                {!carregando && dados.length > 0 && (
                    <Bar data={chartData} options={chartOptions} />
                )}

                {!carregando && dados.length === 0 && (
                    <span className="grafico-vazio">Nenhum dado encontrado</span>
                )}
            </div>

            {/* DETALHES */}
            {labelSelecionado && (
                <div className="ganhos-detalhes">
                    <div className="ganhos-detalhes-topo">
                        <h4>Detalhes do período: {labelSelecionado}</h4>
                        <button onClick={baixarPDFPeriodo}>Baixar PDF</button>
                    </div>

                    {carregandoDetalhes && <p>Carregando detalhes…</p>}

                    {!carregandoDetalhes && detalhes.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Qtd</th>
                                    <th>Vendedor</th>
                                    <th>Venda</th>
                                    <th>Custo</th>
                                    <th>% Ganho</th>
                                    <th>Ganho</th>

                                </tr>
                            </thead>
                            <tbody>
                                {detalhes.map((d, i) => (
                                    <tr key={i}>
                                        <td>{d.data}</td>
                                        <td>{d.produto}</td>
                                        <td>{d.quantidade}</td>
                                        <td>{d.vendedor}</td>
                                        <td>R$ {d.preco_venda.toFixed(2)}</td>
                                        <td>R$ {d.custo.toFixed(2)}</td>

                                        <td
                                            style={{
                                                color:
                                                    (d.custo / d.preco_venda) >= 0.7
                                                        ? "#2ffc07ff"
                                                        : (d.custo / d.preco_venda) >= 0
                                                            ? "#2ffc07ff"
                                                            : "#ff0c0cff",
                                                fontWeight: 600
                                            }}
                                        >
                                            {((d.preco_venda / d.custo) * 100 - 100).toFixed(1)}%
                                        </td>


                                        <td className="ganho">
                                            R$ {d.ganho.toFixed(2)}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

        </div>
    );
}
