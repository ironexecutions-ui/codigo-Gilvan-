import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../../config";
import "./contabilidade.css";
import ContabilidadePdf from "./pdf";
export default function Contabilidade() {

    const [dados, setDados] = useState(null);
    const [modo, setModo] = useState("lista");

    const [filtro, setFiltro] = useState("");

    const [editandoId, setEditandoId] = useState(null);
    const [valorEdicao, setValorEdicao] = useState("");

    const [busca, setBusca] = useState("");
    const [produto, setProduto] = useState(null);
    const [quantos, setQuantos] = useState("");

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_URL}/admin/contabilidade`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setDados(await resp.json());
    }

    async function buscarProduto() {
        const token = localStorage.getItem("token");

        const resp = await fetch(
            `${API_URL}/admin/produtos-servicos?codigo_barras=${busca}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const lista = await resp.json();
        setProduto(lista[0] || null);
    }

    async function salvarAjuste(produto_id, quantosValor) {
        const token = localStorage.getItem("token");

        await fetch(`${API_URL}/admin/contabilidade/ajustar`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                produto_id,
                quantos: parseInt(quantosValor)
            })
        });

        setEditandoId(null);
        setValorEdicao("");
        carregar();
    }

    if (!dados) return <p>Carregando...</p>;

    const termo = filtro.toLowerCase();

    const produtosFiltrados = dados.produtos.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(termo))
    );

    const produtosContabilizados = produtosFiltrados.filter(p => !p.nao_somado);
    const produtosNaoContabilizados = produtosFiltrados.filter(p => p.nao_somado);

    const existeNegativo = produtosContabilizados.some(p => p.negativo);

    return (
        <div className="contabilidade-container">

            <h4>Contabilidade</h4>

            {existeNegativo && (
                <p className="contabilidade-aviso erro">
                    ⚠️ Atenção: foram identificadas divergências no estoque.
                    A quantidade registrada de alguns produtos não está compatível
                    com o volume de vendas realizadas. Verifique os itens destacados
                    em vermelho para correção.
                </p>
            )}

            {modo === "lista" && (
                <>

                    <div className="contabilidade-topo">
                        <input
                            placeholder="Filtrar por nome ou código de barras"
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                        />

                    </div>
                    <ContabilidadePdf />

                    <ul className="contabilidade-lista">
                        {produtosContabilizados.map(p => (
                            <li
                                key={p.id}
                                className={p.negativo ? "produto-negativo" : ""}
                            >
                                <span>{p.nome}</span>

                                {editandoId === p.id ? (
                                    <input
                                        type="number"
                                        autoFocus
                                        value={valorEdicao}
                                        onChange={e => setValorEdicao(e.target.value)}
                                        onBlur={() => {
                                            setEditandoId(null);
                                            setValorEdicao("");
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" && valorEdicao !== "") {
                                                salvarAjuste(p.id, valorEdicao);
                                            }
                                        }}
                                    />
                                ) : (
                                    <strong
                                        className={
                                            p.negativo
                                                ? "quantidade-clicavel quantidade-negativa"
                                                : "quantidade-clicavel"
                                        }
                                        onClick={() => {
                                            setEditandoId(p.id);
                                            setValorEdicao("");
                                        }}
                                    >
                                        {p.quantidade}
                                    </strong>
                                )}
                            </li>
                        ))}
                    </ul>

                    {dados.sem_contagem > 0 && (
                        <p className="contabilidade-aviso">
                            Existem {dados.sem_contagem} produtos ainda não contados
                        </p>
                    )}
                </>
            )}

            {produtosNaoContabilizados.length > 0 && (
                <>
                    <h5 className="titulo-nao-contabilizados">
                        Produtos ainda não contabilizados
                    </h5>

                    <ul className="contabilidade-lista nao-contabilizados">
                        {produtosNaoContabilizados.map(p => (
                            <li
                                key={p.id}
                                className="produto-nao-somado"
                            >
                                <span>{p.nome}</span>

                                {editandoId === p.id ? (
                                    <input
                                        type="number"
                                        autoFocus
                                        value={valorEdicao}
                                        onChange={e => setValorEdicao(e.target.value)}
                                        onBlur={() => {
                                            setEditandoId(null);
                                            setValorEdicao("");
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" && valorEdicao !== "") {
                                                salvarAjuste(p.id, valorEdicao);
                                            }
                                        }}
                                    />
                                ) : (
                                    <strong
                                        className="quantidade-clicavel quantidade-nao-somada"
                                        onClick={() => {
                                            setEditandoId(p.id);
                                            setValorEdicao("");
                                        }}
                                    >
                                        {p.quantidade}
                                    </strong>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}

        </div>
    );
}
