import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../../../../../config";
import "./modalregistrorapido.css";

export default function ModalCadastroProduto({ textoInicial, fechar, onCriado }) {

    const ehCodigo = /^\d+$/.test(textoInicial);

    const [nome, setNome] = useState(ehCodigo ? "" : textoInicial);
    const [codigo, setCodigo] = useState(ehCodigo ? textoInicial : "");
    const [unidade, setUnidade] = useState("");
    const [preco, setPreco] = useState("");
    const [categoria, setCategoria] = useState("");
    const [salvando, setSalvando] = useState(false);

    const nomeRef = useRef(null);
    const codigoRef = useRef(null);
    const unidadeRef = useRef(null);
    const precoRef = useRef(null);
    const categoriaRef = useRef(null);

    const campos = [
        nomeRef,
        codigoRef,
        unidadeRef,
        precoRef,
        categoriaRef
    ];

    // foco inicial correto
    useEffect(() => {
        if (ehCodigo) {
            nomeRef.current?.focus();
        } else {
            codigoRef.current?.focus();
        }
    }, []);

    function handleEnterCampo(e, index) {
        if (e.key !== "Enter") return;

        e.preventDefault();

        // se não for o último campo, vai para o próximo
        if (index < campos.length - 1) {
            campos[index + 1].current?.focus();
            return;
        }

        // último campo → tenta salvar
        salvar();
    }

    async function salvar() {
        if (salvando) return;

        if (!nome.trim()) {
            nomeRef.current?.focus();
            return;
        }

        setSalvando(true);

        try {
            const token = localStorage.getItem("token");

            const resp = await fetch(
                `${API_URL}/api/produtos_servicos/criar-rapido`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nome: nome.trim(),
                        codigo_barras: codigo.trim(),
                        unidade,
                        preco: preco || null,
                        categoria
                    })
                }
            );

            if (!resp.ok) return;

            const produto = await resp.json();
            onCriado(produto);
            fechar();

        } catch {
            alert("Erro de conexão");
        } finally {
            setSalvando(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={fechar}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

                <h3>Novo produto</h3>

                <div className="field">
                    <label>Nome do produto</label>
                    <input
                        ref={nomeRef}
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Ex: Pizza Calabresa"
                        onKeyDown={(e) => handleEnterCampo(e, 0)}
                    />
                </div>

                <div className="field">
                    <label>Código de barras</label>
                    <input
                        ref={codigoRef}
                        value={codigo}
                        onChange={e => setCodigo(e.target.value)}
                        placeholder="Leitor ou digite"
                        onKeyDown={(e) => handleEnterCampo(e, 1)}
                    />
                </div>

                <div className="field">
                    <label>Unidade</label>
                    <input
                        ref={unidadeRef}
                        value={unidade}
                        onChange={e => setUnidade(e.target.value)}
                        placeholder="Ex: unidade, kg, hora"
                        onKeyDown={(e) => handleEnterCampo(e, 2)}
                    />
                </div>

                <div className="field">
                    <label>Preço</label>
                    <input
                        ref={precoRef}
                        value={preco}
                        onChange={e => setPreco(e.target.value)}
                        placeholder="Ex: 39.90"
                        onKeyDown={(e) => handleEnterCampo(e, 3)}
                    />
                </div>

                <div className="field">
                    <label>Categoria</label>
                    <input
                        ref={categoriaRef}
                        value={categoria}
                        onChange={e => setCategoria(e.target.value)}
                        placeholder="Ex: Pizzas"
                        onKeyDown={(e) => handleEnterCampo(e, 4)}
                    />
                </div>

                <button onClick={salvar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar"}
                </button>

                <button onClick={fechar}>Cancelar</button>

            </div>
        </div>,
        document.body
    );
}
