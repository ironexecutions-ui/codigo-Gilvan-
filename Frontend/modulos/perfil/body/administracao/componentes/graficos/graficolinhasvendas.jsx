import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
} from "chart.js";

import { API_URL } from "../../../../../../config";
import "./graficolinhasvendas.css";

ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
);

export default function GraficoLinhasVendas() {

    const [periodo, setPeriodo] = useState("dias");
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const token = localStorage.getItem("token");

    /* ===============================
       MÉTRICAS DERIVADAS
    =============================== */
    const totalPeriodo = dados.reduce((acc, d) => acc + d.total, 0);
    const mediaPeriodo = dados.length ? (totalPeriodo / dados.length) : 0;
    const maiorValor = Math.max(...dados.map(d => d.total), 0);

    /* ===============================
       TROCAR PERÍODO
    =============================== */
    function alternarPeriodo() {
        if (periodo === "dias") return setPeriodo("semanas");
        if (periodo === "semanas") return setPeriodo("meses");
        setPeriodo("dias");
    }

    /* ===============================
       BUSCAR DADOS
    =============================== */
    useEffect(() => {
        async function carregar() {
            setCarregando(true);

            const params = new URLSearchParams();
            params.append("periodo", periodo);

            const resp = await fetch(
                `${API_URL}/admin/graficos/linhas?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (resp.ok) {
                const json = await resp.json();
                setDados(json);
            } else {
                setDados([]);
            }

            setCarregando(false);
        }

        carregar();
    }, [periodo]);

    /* ===============================
       DADOS DO GRÁFICO
    =============================== */
    const chartData = {
        labels: dados.map(d => d.label),
        datasets: [
            {
                label: "Total de Vendas",
                data: dados.map(d => d.total),
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56,189,248,0.15)",
                tension: 0.35,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: "Média",
                data: dados.map(() => mediaPeriodo),
                borderColor: "rgba(148,163,184,0.5)",
                borderDash: [6, 6],
                pointRadius: 0,
                fill: false
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 600,
            easing: "easeOutQuart"
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
                    label: ctx => {
                        const valor = ctx.raw;
                        const percentual = totalPeriodo
                            ? ((valor / totalPeriodo) * 100).toFixed(1)
                            : 0;

                        return `R$ ${valor.toFixed(2)} • ${percentual}% do período`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: "#94a3b8" },
                grid: { color: "rgba(148,163,184,0.1)" }
            },
            y: {
                ticks: { color: "#94a3b8" },
                grid: { color: "rgba(148,163,184,0.1)" }
            }
        }
    };

    return (
        <div className="grafico-linhas-container">

            <div className="grafico-linhas-resumo">
                <div>
                    <span>Total</span>
                    <strong>R$ {totalPeriodo.toFixed(2)}</strong>
                </div>
                <div>
                    <span>Média</span>
                    <strong>R$ {mediaPeriodo.toFixed(2)}</strong>
                </div>
                <div>
                    <span>Pico</span>
                    <strong>R$ {maiorValor.toFixed(2)}</strong>
                </div>
            </div>

            <div className="grafico-linhas-topo">
                <button onClick={alternarPeriodo}>
                    {periodo === "dias" && "Últimos 7 dias"}
                    {periodo === "semanas" && "Últimas 7 semanas"}
                    {periodo === "meses" && "Últimos 7 meses"}
                </button>
            </div>

            <div className="grafico-linhas-conteudo">

                {carregando && (
                    <div className="grafico-loading">
                        <span className="spinner"></span>
                        <p>Carregando dados…</p>
                    </div>
                )}

                {!carregando && dados.length > 0 && (
                    <Line data={chartData} options={chartOptions} />
                )}

                {!carregando && dados.length === 0 && (
                    <span className="grafico-vazio">
                        Nenhum dado encontrado
                    </span>
                )}

            </div>
        </div>
    );
}
