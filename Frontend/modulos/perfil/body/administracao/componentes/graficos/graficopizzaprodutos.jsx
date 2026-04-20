import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

import { API_URL } from "../../../../../../config";
import "./graficopizzaprodutos.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function GraficoPizzaProdutos() {
    const [carregando, setCarregando] = useState(true);

    const [modo, setModo] = useState("produtos");
    const [data, setData] = useState("");
    const [limite, setLimite] = useState(5);
    const [dados, setDados] = useState([]);

    const token = localStorage.getItem("token");

    /* ===============================
       TROCAR MODO
    =============================== */
    function alternarModo() {
        if (modo === "produtos") return setModo("pagamentos");
        if (modo === "pagamentos") return setModo("funcionarios");
        setModo("produtos");
    }

    /* ===============================
       BUSCAR DADOS
    =============================== */
    useEffect(() => {
        async function carregar() {
            setCarregando(true);

            const params = new URLSearchParams();
            params.append("modo", modo);

            if (data) {
                params.append("data", data);
            }

            if (modo === "produtos" && limite) {
                params.append("limite", limite);
            }

            try {
                const resp = await fetch(
                    `${API_URL}/admin/graficos/pizza?${params.toString()}`,
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
            } catch {
                setDados([]);
            } finally {
                setCarregando(false);
            }
        }

        carregar();
    }, [modo, data, limite]);


    const inputBloqueado = modo !== "produtos";
    function quebrarTexto(texto, limite = 18) {
        if (!texto) return "";

        const palavras = texto.split(" ");
        let linhas = [];
        let linhaAtual = "";

        palavras.forEach(p => {
            if ((linhaAtual + p).length <= limite) {
                linhaAtual += (linhaAtual ? " " : "") + p;
            } else {
                linhas.push(linhaAtual);
                linhaAtual = p;
            }
        });

        if (linhaAtual) linhas.push(linhaAtual);

        return linhas.join("\n");
    }

    /* ===============================
       DADOS DO GRÁFICO
    =============================== */
    const chartData = {
        labels: dados.map(d => quebrarTexto(d.nome)),
        datasets: [
            {
                data: dados.map(d => d.quantidade),
                backgroundColor: [
                    "#38bdf8",
                    "#22c55e",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                    "#14b8a6",
                    "#e11d48",
                    "#0ea5e9"
                ],
                borderWidth: 1,
                borderColor: "#020617"
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right",
                labels: {
                    color: "#e5e7eb",
                    boxWidth: 14,
                    padding: 14,
                    font: {
                        size: 12,
                        lineHeight: 1.2
                    }
                }
            },

            tooltip: {
                callbacks: {
                    label: function (context) {
                        const item = dados[context.dataIndex];
                        return `${item.quantidade} (${item.percentual}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="grafico-pizza-container">

            <div className="grafico-pizza-topo">
                <input
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                />

                <input
                    type="number"
                    min="1"
                    value={limite}
                    readOnly={inputBloqueado}
                    onChange={e => setLimite(e.target.value)}
                    placeholder="Qtd itens"
                />

                <button onClick={alternarModo}>
                    {modo === "produtos" && "Produtos"}
                    {modo === "pagamentos" && "Pagamentos"}
                    {modo === "funcionarios" && "Funcionários"}
                </button>
            </div>

            <div className="grafico-pizza-conteudo">
                {carregando ? (
                    <div className="grafico-loading">
                        <div className="loading-ring"></div>
                        <span>Processando dados</span>
                    </div>
                ) : dados.length > 0 ? (
                    <Pie data={chartData} options={chartOptions} />
                ) : (
                    <span className="grafico-vazio">
                        Nenhum dado encontrado
                    </span>
                )}
            </div>

        </div>
    );
}
