import React, { useState, useEffect, useRef } from "react";
import { useVenda } from "./vendaprovider";
import { API_URL } from "../../../../../config";
import "./produtoatual.css";

export default function ProdutoAtual() {

    const { produtoAtual, setProdutoAtual, atualizarPrecoItem } = useVenda();

    const [podeEditar, setPodeEditar] = useState(false);
    const [editando, setEditando] = useState(false);
    const [novoPreco, setNovoPreco] = useState("");
    const [tema, setTema] = useState("escuro");

    const inputRef = useRef(null);
    const salvandoRef = useRef(false);

    /* ===============================
       DEFINIR TEMA LOCAL
    =============================== */
    useEffect(() => {
        async function definirTema() {
            let modoCliente = null;

            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const resp = await fetch(
                        `${API_URL}/api/clientes/modo`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (resp.ok) {
                        const data = await resp.json();
                        modoCliente = data.modo;
                    }
                }
            } catch { }

            if (modoCliente === 1) return setTema("escuro");
            if (modoCliente === 2) return setTema("claro");

            const hora = new Date().getHours();
            setTema(hora >= 18 || hora < 6 ? "escuro" : "claro");
        }

        definirTema();
    }, []);

    /* ===============================
       PERMISSÃO EDITAR PREÇO
    =============================== */
    useEffect(() => {
        async function verificarPermissao() {
            try {
                const token = localStorage.getItem("token");
                const resp = await fetch(
                    `${API_URL}/api/clientes/pode-editar-preco`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!resp.ok) return setPodeEditar(false);
                const data = await resp.json();
                setPodeEditar(data.pode_editar === true);
            } catch {
                setPodeEditar(false);
            }
        }

        verificarPermissao();
    }, []);

    /* ===============================
       FOCO NO INPUT
    =============================== */
    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editando]);

    /* ===============================
       ATALHO CTRL + M
    =============================== */
    useEffect(() => {
        function atalhosTeclado(e) {
            if (!podeEditar) return;
            if (!produtoAtual) return;
            if (editando) return;

            if (e.ctrlKey && (e.key === "m" || e.key === "M")) {
                e.preventDefault();
                setNovoPreco(produtoAtual.preco.toFixed(2));
                setEditando(true);
            }
        }

        window.addEventListener("keydown", atalhosTeclado);
        return () => window.removeEventListener("keydown", atalhosTeclado);
    }, [podeEditar, produtoAtual, editando]);

    /* ===============================
       RETORNO SEM PRODUTO
    =============================== */
    if (!produtoAtual) {
        return (
            <div className={`produto-atual-box tema-${tema}`}>
                <h3 className="produto-atual-titulo">Produto atual</h3>
                <p className="produto-atual-vazio">Nenhum produto selecionado</p>
            </div>
        );
    }

    async function salvarPreco() {
        if (salvandoRef.current) return;

        const precoNumerico = parseFloat(novoPreco);
        if (isNaN(precoNumerico) || precoNumerico <= 0) {
            alert("Preço inválido");
            return;
        }

        try {
            salvandoRef.current = true;
            const token = localStorage.getItem("token");

            const resp = await fetch(`${API_URL}/api/produtos/atualizar-preco`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    produto_id: produtoAtual.id,
                    novo_preco: precoNumerico
                })
            });

            if (!resp.ok) {
                const text = await resp.text();
                alert(text || "Erro ao atualizar preço");
                return;
            }

            const atualizado = { ...produtoAtual, preco: precoNumerico };
            setProdutoAtual(atualizado);
            atualizarPrecoItem(atualizado);
            setEditando(false);

        } catch {
            alert("Erro de conexão");
        } finally {
            salvandoRef.current = false;
        }
    }

    const imagemFinal =
        produtoAtual.imagem_url?.split("|")[0] ||
        produtoAtual.imagem_comercio?.split("|")[0] ||
        null;

    return (
        <div className={`produto-atual-box tema-${tema}`}>
            <div className="produto-atual-conteudo">

                <div className="produto-atual-esq">
                    {imagemFinal && (
                        <img
                            src={imagemFinal}
                            alt=""
                            className="produto-atual-img"
                            onError={(e) => e.currentTarget.style.display = "none"}
                        />
                    )}
                </div>

                <div className="produto-atual-dir">
                    <p className="produto-atual-nome">
                        <strong>{produtoAtual.nome}</strong>
                    </p>

                    {!editando ? (
                        <p
                            className={`produto-atual-preco ${podeEditar ? "clicavel" : ""}`}
                            onClick={() => {
                                if (!podeEditar) return;
                                setNovoPreco(produtoAtual.preco.toFixed(2));
                                setEditando(true);
                            }}
                        >
                            Preço R$ <span>{produtoAtual.preco.toFixed(2)}</span>
                        </p>
                    ) : (
                        <div className="preco-edicao">
                            <input
                                ref={inputRef}
                                type="number"
                                step="0.01"
                                className="preco-inline-input"
                                value={novoPreco}
                                onChange={e => setNovoPreco(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        salvarPreco();
                                    }
                                    if (e.key === "Escape") {
                                        e.preventDefault();
                                        setEditando(false);
                                    }
                                }}
                            />
                            <button className="btn-salvar-preco" onClick={salvarPreco}>
                                Salvar
                            </button>
                        </div>
                    )}

                    <p className="produto-atual-und">
                        {produtoAtual.unidade || produtoAtual.tempo_servico}
                    </p>
                </div>

            </div>
        </div>
    );
}
