import React, { useEffect, useState } from "react";
import { URL } from "../../url";
import ModalProduto from "./modalproduto";
import "./produtoscomercio.css";

export default function ProdutosComercio() {
    const cliente = (() => {
        try {
            return JSON.parse(localStorage.getItem("cliente")) || {};
        } catch {
            return {};
        }
    })();

    const token = localStorage.getItem("token");

    const [lista, setLista] = useState([]);
    const [filtroNome, setFiltroNome] = useState("");
    const [filtroCodigo, setFiltroCodigo] = useState("");
    const [produtoSelecionado, setProdutoSelecionado] = useState(undefined);

    async function carregar() {
        if (!cliente.id) {
            console.error("Cliente sem id no localStorage");
            setLista([]);
            return;
        }

        const resp = await fetch(
            `${URL}/produtos_servicos_tabela`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const json = await resp.json();

        if (Array.isArray(json)) {
            setLista(json);
        } else {
            console.error("Resposta inválida:", json);
            setLista([]);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    function filtrar(item) {
        if (
            filtroNome &&
            !item.nome.toLowerCase().includes(filtroNome.toLowerCase())
        ) return false;

        if (filtroCodigo) {
            const soNumero = /^\d+$/.test(filtroCodigo);
            if (soNumero) {
                return item.codigo_barras?.includes(filtroCodigo);
            } else {
                return item.qrcode
                    ?.toLowerCase()
                    .includes(filtroCodigo.toLowerCase());
            }
        }

        return true;
    }

    function renderTipo(item) {
        if (item.produto_id > 0) return item.unidades;
        if (item.unidade) return item.unidade;
        return item.tempo_servico;
    }

    return (
        <div className="produtos-comercio-container">

            <div className="produtos-filtros">
                <input
                    placeholder="Filtrar por nome"
                    value={filtroNome}
                    onChange={e => setFiltroNome(e.target.value)}
                />

                <input
                    placeholder="Código de barras ou QRCode"
                    value={filtroCodigo}
                    onChange={e => setFiltroCodigo(e.target.value)}
                />
            </div>

            <button
                className="btn-adicionar-produto"
                onClick={() => setProdutoSelecionado(null)}
            >
                + Adicionar produto
            </button>

            <div className="tabela-wrapper">
                <div className="produtos-grid">

                    <div className="produtos-grid-header">
                        <div></div>
                        <div>Nome</div>
                        <div>Tipo</div>
                        <div>Preço</div>
                        <div>Categoria</div>
                    </div>

                    {lista.filter(filtrar).map(item => (
                        <div
                            key={item.id}
                            className="produtos-grid-row"
                            onClick={() => setProdutoSelecionado(item)}
                        >
                            <div>
                                {item.imagem_url ? (
                                    <img
                                        src={item.imagem_url}
                                        alt=""
                                        className="produto-img"
                                    />
                                ) : (
                                    <div className="produto-img-vazia">
                                        Arraste imagem
                                    </div>
                                )}
                            </div>

                            <div>{item.nome}</div>
                            <div>{renderTipo(item)}</div>
                            <div className="preco">R$ {item.preco}</div>

                            <div className="categoria-acoes">
                                {item.categoria}

                                <button
                                    className="btn-apagar-produto"
                                    onClick={async e => {
                                        e.stopPropagation();
                                        if (!window.confirm(`Apagar "${item.nome}"?`)) return;
                                        await fetch(`${URL}/produtos_servicos_tabela/${item.id}`, {
                                            method: "DELETE",
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        carregar();
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {produtoSelecionado !== undefined && (
                <ModalProduto
                    produto={produtoSelecionado}
                    fechar={() => setProdutoSelecionado(undefined)}
                    atualizar={carregar}
                />
            )}

        </div>

    );
}
