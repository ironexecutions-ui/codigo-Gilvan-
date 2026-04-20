import React, { useEffect, useState } from "react";
import FormularioProduto from "./formularioproduto";
import { API_URL } from "../../../../../config";
import "./resumoprodutos.css";

export default function ResumoProdutos() {

    const [lista, setLista] = useState([]);
    const [modo, setModo] = useState("lista");
    const [editar, setEditar] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const duplicados = lista.filter(i => i.duplicado === 1);

    const [limite, setLimite] = useState(30);
    const [filtroNome, setFiltroNome] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [precoMin, setPrecoMin] = useState("");
    const [precoMax, setPrecoMax] = useState("");
    const [confirmarId, setConfirmarId] = useState(null);
    const [filtroVencimento, setFiltroVencimento] = useState(false);

    const token = localStorage.getItem("token");

    async function carregar() {
        setCarregando(true);

        const resp = await fetch(`${API_URL}/admin/produtos-servicos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resp.json();
        setLista(dados);
        setCarregando(false);
    }

    useEffect(() => { carregar(); }, []);

    function colunaUnidade(item) {
        if (item.produto_id > 0)
            return `${item.unidades}x ${item.nome_produto_base}`;
        if (item.unidade) return item.unidade;
        return item.tempo_servico;
    }

    if (modo !== "lista") {
        return (
            <FormularioProduto
                item={editar}
                voltar={() => {
                    setModo("lista");
                    setEditar(null);
                    setLimite(30);
                    carregar();
                }}
            />
        );
    }

    const listaFiltrada = lista.filter(item => {

        if (filtroNome) {
            if (!item.nome?.toLowerCase().includes(filtroNome.toLowerCase())) {
                return false;
            }
        }

        if (filtroCategoria) {
            if (!item.categoria?.toLowerCase().includes(filtroCategoria.toLowerCase())) {
                return false;
            }
        }

        const preco = Number(item.preco);

        if (precoMin !== "" && preco < Number(precoMin)) {
            return false;
        }

        if (precoMax !== "" && preco > Number(precoMax)) {
            return false;
        }
        if (filtroVencimento) {
            if (!produtoVencidoOuPerto(item.data_vencimento)) {
                return false;
            }
        }

        return true;
    });

    const itensVisiveis = listaFiltrada.slice(0, limite);
    const temMais = listaFiltrada.length > limite;
    function produtoVencidoOuPerto(data) {
        if (!data) return false;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const vencimento = new Date(data);
        vencimento.setHours(0, 0, 0, 0);

        const limite = new Date(hoje);
        limite.setDate(limite.getDate() + 7);

        return vencimento <= limite;
    }

    return (
        <div className="resumo-produtos">
            <div className="topo">
                <h4>Produtos e Serviços</h4>
                {duplicados.length > 0 && (
                    <button style={{ display: "none" }}
                        className="btn-duplicados"
                        onClick={async () => {
                            if (!window.confirm(
                                `Existem ${duplicados.length} produtos duplicados. Deseja apagar todos?`
                            )) return;

                            await fetch(`${API_URL}/admin/produtos-servicos/duplicados`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            carregar();
                        }}
                    >
                        ⚠️ Duplicados ({duplicados.length})
                    </button>
                )}

                <button onClick={() => setModo("novo")}>Adicionar</button>
            </div>
            <div className="filtros-produtos">

                <input
                    type="text"
                    placeholder="Filtrar por nome"
                    value={filtroNome}
                    onChange={e => {
                        setFiltroNome(e.target.value);
                        setLimite(30);
                    }}
                />

                <input
                    type="text"
                    placeholder="Filtrar por categoria"
                    value={filtroCategoria}
                    onChange={e => {
                        setFiltroCategoria(e.target.value);
                        setLimite(30);
                    }}
                />

                <input
                    type="number"
                    placeholder="Preço mínimo"
                    value={precoMin}
                    onChange={e => {
                        setPrecoMin(e.target.value);
                        setLimite(30);
                    }}
                />

                <input
                    type="number"
                    placeholder="Preço máximo"
                    value={precoMax}
                    onChange={e => {
                        setPrecoMax(e.target.value);
                        setLimite(30);
                    }}
                />
                <button
                    className={`btn-vencimento ${filtroVencimento ? "ativo" : ""}`}
                    onClick={() => {
                        setFiltroVencimento(v => !v);
                        setLimite(30);
                    }}
                >
                    {filtroVencimento
                        ? "Mostrando vencidos / a vencer"
                        : "Filtrar vencidos / a vencer"}
                </button>

            </div>

            <div className="conteudo-scroll">
                {carregando ? (
                    <div className="loading-area">
                        <div className="spinner"></div>
                        <span style={{ color: "white" }} >Carregando produtos...</span>
                    </div>
                ) : (
                    <>
                        <div className="lista-cards">
                            {itensVisiveis.map(item => (
                                <div
                                    className={`card-produto ${item.duplicado ? "duplicado" : ""}`}
                                    key={item.id}
                                >
                                    <div onClick={() => {
                                        setEditar(item);
                                        setModo("editar");
                                    }} className="card-info">
                                        <h5>{item.nome}</h5>

                                        <span className="sub">
                                            {colunaUnidade(item)} · {item.categoria}
                                        </span>

                                        <div className="precos">
                                            <div>
                                                <label>Preço </label>
                                                <strong>R$ {item.preco}</strong>
                                            </div>
                                            <div>
                                                <label>Recebido </label>
                                                <strong>R$ {item.preco_recebido}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-acoes">

                                        <button
                                            className={`apagar ${confirmarId === item.id ? "confirmar" : ""}`}
                                            onClick={async () => {
                                                if (confirmarId !== item.id) {
                                                    setConfirmarId(item.id);
                                                    return;
                                                }

                                                await fetch(`${API_URL}/admin/produtos-servicos/${item.id}`, {
                                                    method: "DELETE",
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });

                                                setConfirmarId(null);
                                                carregar();
                                            }}
                                        >
                                            {confirmarId === item.id ? "Confirmar" : "Apagar"}
                                        </button>


                                    </div>
                                </div>
                            ))}
                        </div>

                        {temMais && (
                            <div className="ver-mais-area">
                                <button
                                    className="ver-mais"
                                    onClick={() => setLimite(l => l + 30)}
                                >
                                    Ver mais
                                </button>
                                <span>
                                    Mostrando {itensVisiveis.length} de {listaFiltrada.length}
                                </span>

                            </div>
                        )}
                    </>
                )}
            </div>


        </div>
    );

}