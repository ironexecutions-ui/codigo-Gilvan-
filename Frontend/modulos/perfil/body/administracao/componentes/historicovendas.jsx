import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import PreviewProdutosVenda from "./previewprodutosvendas";
import "./historicovendas.css";

export default function HistoricoVendas() {
    const [previewAtivo, setPreviewAtivo] = useState(false);

    const [vendas, setVendas] = useState([]);
    const [limite, setLimite] = useState(20);
    const [carregando, setCarregando] = useState(true);
    const [vendaAtiva, setVendaAtiva] = useState(null);

    const [filtroProtocolo, setFiltroProtocolo] = useState("");
    const [filtroOperador, setFiltroOperador] = useState("");
    const [filtroValorMin, setFiltroValorMin] = useState("");
    const [filtroValorMax, setFiltroValorMax] = useState("");
    const [filtroDataMin, setFiltroDataMin] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");

    function traduzirModulo(valor) {
        if (valor === 1) return "Caixa";
        if (valor === 4) return "Online";
        if (valor === 6) return "Agendamento";
        return "—";
    }

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            const token = localStorage.getItem("token");

            const resp = await fetch(`${API_URL}/admin/vendas`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const json = await resp.json();
            setVendas(json);
        } catch (e) {
            console.error(e);
        } finally {
            setCarregando(false);
        }
    }

    function formatarHora(segundos) {
        const segundosAjustados = (Number(segundos) + 3 * 3600) % 86400;

        const h = Math.floor(segundosAjustados / 3600);
        const m = Math.floor((segundosAjustados % 3600) / 60);
        const s = segundosAjustados % 60;

        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }


    function abrirComanda(link) {
        window.open(link, "_blank");
    }

    if (carregando) {
        return (
            <div className="hv-container">
                <p className="hv-loading">Carregando...</p>
            </div>
        );
    }

    const vendasFiltradas = vendas.filter(v => {

        if (filtroProtocolo && Number(v.id) !== Number(filtroProtocolo)) {
            return false;
        }

        if (
            filtroOperador &&
            !v.operador.toLowerCase().includes(filtroOperador.toLowerCase())
        ) {
            return false;
        }

        if (filtroStatus && v.status !== filtroStatus) {
            return false;
        }

        if (filtroValorMin && Number(v.valor_pago) < Number(filtroValorMin)) {
            return false;
        }

        if (filtroValorMax && Number(v.valor_pago) > Number(filtroValorMax)) {
            return false;
        }

        if (filtroDataMin && new Date(v.data) < new Date(filtroDataMin)) {
            return false;
        }

        return true;
    });

    return (
        <div className="hv-container">

            <div className="hv-header">
                <h4>Histórico de Vendas</h4>
                <span className="hv-total">
                    {vendasFiltradas.length} vendas
                </span>
            </div>

            <div className="hv-filtros">

                <input
                    type="number"
                    placeholder="Protocolo"
                    value={filtroProtocolo}
                    onChange={e => setFiltroProtocolo(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Operador"
                    value={filtroOperador}
                    onChange={e => setFiltroOperador(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Valor mínimo"
                    value={filtroValorMin}
                    onChange={e => setFiltroValorMin(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Valor máximo"
                    value={filtroValorMax}
                    onChange={e => setFiltroValorMax(e.target.value)}
                />

                <input
                    type="date"
                    value={filtroDataMin}
                    onChange={e => setFiltroDataMin(e.target.value)}
                />

                <select
                    value={filtroStatus}
                    onChange={e => setFiltroStatus(e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                </select>

                <button
                    className={`hv-toggle-preview ${previewAtivo ? "ativo" : ""}`}
                    onClick={() => setPreviewAtivo(!previewAtivo)}
                    type="button"
                >
                    Preview
                </button>

            </div>

            <div className="hv-tabela-wrapper">
                <table className="hv-tabela">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Hora</th>
                            <th>Valor</th>
                            <th>Pagamento</th>
                            <th>Status</th>
                            <th>Operador</th>
                            <th>Maquininha</th>
                            <th>Módulo</th>
                            <th>Ação</th>
                        </tr>
                    </thead>

                    <tbody>
                        {vendasFiltradas.slice(0, limite).map(v => (
                            <tr
                                key={v.id}
                                className={`hv-linha ${vendaAtiva?.id === v.id ? "hv-ativa" : ""}`}
                                onMouseEnter={() => setVendaAtiva(v)}
                            >
                                <td>{v.data}</td>
                                <td>{formatarHora(Number(v.hora))}</td>
                                <td className="hv-valor">
                                    R$ {Number(v.valor_pago).toFixed(2)}
                                </td>
                                <td className={`hv-pagamento hv-pagamento-${v.pagamento}`}>
                                    {v.pagamento}
                                </td>
                                <td className={`hv-status hv-status-${v.status}`}>
                                    {v.status}
                                </td>
                                <td>{v.operador}</td>
                                <td>{v.maquininha || "-"}</td>
                                <td className={`hv-modulo hv-modulo-${v.modulo}`}>
                                    {traduzirModulo(v.modulo)}
                                </td>
                                <td>
                                    {v.comanda ? (
                                        <button
                                            className="hv-botao-comanda"
                                            onClick={() => abrirComanda(v.comanda)}
                                        >
                                            Ver comanda
                                        </button>
                                    ) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {limite < vendasFiltradas.length && (
                    <div className="hv-ver-mais">
                        <button onClick={() => setLimite(limite + 20)}>
                            Ver mais
                        </button>
                    </div>
                )}
            </div>

            {previewAtivo && <PreviewProdutosVenda venda={vendaAtiva} />}

        </div>
    );
}
