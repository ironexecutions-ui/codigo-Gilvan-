import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../../../config";
import "./vendascomercios.css";

export default function VendasComercios() {
    const [dadosBrutos, setDadosBrutos] = useState([]);
    const [dados, setDados] = useState([]);
    const [total, setTotal] = useState(0);
    const [carregando, setCarregando] = useState(true);

    const [dataMinima, setDataMinima] = useState("");
    const [filtroLoja, setFiltroLoja] = useState("");

    useEffect(() => {
        async function carregar() {
            try {
                const token = localStorage.getItem("token");

                const resp = await fetch(
                    `${API_URL}/admin/vendas/contagem-comercios`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const json = await resp.json();
                setDadosBrutos(json);
            } catch (err) {
                console.error("Erro ao buscar vendas", err);
            } finally {
                setCarregando(false);
            }
        }

        carregar();
    }, []);

    useEffect(() => {
        let filtrado = [...dadosBrutos];

        if (dataMinima) {
            filtrado = filtrado.filter(v => v.data >= dataMinima);
        }

        if (filtroLoja) {
            filtrado = filtrado.filter(v =>
                v.loja.toLowerCase().includes(filtroLoja.toLowerCase())
            );
        }

        const totalVendas = filtrado.length;
        setTotal(totalVendas);

        const mapa = {};

        filtrado.forEach(v => {
            if (!mapa[v.empresa]) {
                mapa[v.empresa] = {
                    empresa: v.empresa,
                    loja: v.loja,
                    quantidade: 0
                };
            }
            mapa[v.empresa].quantidade += 1;
        });

        const lista = Object.values(mapa).map(item => ({
            ...item,
            porcentagem: totalVendas > 0
                ? ((item.quantidade / totalVendas) * 100).toFixed(2)
                : "0.00"
        }));

        setDados(lista);
    }, [dadosBrutos, dataMinima, filtroLoja]);

    return (
        <section className="vc-wrapper">
            <header className="vc-header">
                <h2 className="vc-title">Vendas por comércio</h2>
            </header>

            {/* FILTROS */}
            <div className="vc-filters">
                <div className="vc-filter-group">
                    <label>Data mínima</label>
                    <input
                        type="date"
                        value={dataMinima}
                        onChange={e => setDataMinima(e.target.value)}
                    />
                </div>

                <div className="vc-filter-group">
                    <label>Nome da loja</label>
                    <input
                        type="text"
                        placeholder="Ex: Mercado"
                        value={filtroLoja}
                        onChange={e => setFiltroLoja(e.target.value)}
                    />
                </div>
            </div>

            {/* ESTADOS */}
            {carregando && <p className="vc-status">Carregando dados...</p>}

            {!carregando && dados.length === 0 && (
                <p className="vc-status">Nenhuma venda encontrada.</p>
            )}

            {!carregando && dados.length > 0 && (
                <div className="vc-table-wrapper">
                    <table className="vc-table">
                        <thead>
                            <tr>
                                <th>Comércio</th>
                                <th>Quantidade</th>
                                <th>Porcentagem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.map(item => (
                                <tr key={item.empresa}>
                                    <td className="vc-loja">{item.loja}</td>
                                    <td className="vc-qtd">{item.quantidade}</td>
                                    <td className="vc-pct">{item.porcentagem}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
