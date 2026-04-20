import React, { useEffect, useState } from "react";
import FormularioImagens from "./formularioimagens";
import { API_URL } from "../../../../../config";
import "./formularioproduto.css";

export default function FormularioProduto({ item, voltar }) {
    const [categorias, setCategorias] = useState([]);

    const [tipo, setTipo] = useState("produto");
    const [produtos, setProdutos] = useState([]);

    const [form, setForm] = useState(item || {
        nome: "",
        codigo_barras: "",
        qrcode: "",
        preco: "",
        preco_recebido: "",
        categoria: "",
        imagem_url: "",
        disponivel: 1,
        unidade: "",
        produto_id: 0,
        unidades: 0,
        tempo_servico: "",
        data_vencimento: ""

    });

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        const token = localStorage.getItem("token");

        const resp = await fetch(`${API_URL}/admin/produtos-servicos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resp.json();

        // Produtos simples para pacote
        setProdutos(dados.filter(p => !p.produto_id && p.unidade));

        // Categorias únicas
        const categoriasUnicas = [...new Set(
            dados
                .map(p => p.categoria)
                .filter(c => c && c.trim() !== "")
        )];

        setCategorias(categoriasUnicas);
    }


    function alterar(campo, valor) {
        setForm({ ...form, [campo]: valor });
    }

    function selecionarProdutoBase(nome) {
        const produto = produtos.find(p => p.nome === nome);
        if (produto) alterar("produto_id", produto.id);
    }

    async function salvar() {
        const token = localStorage.getItem("token");

        // payload base comum a todos
        const payload = {
            nome: form.nome,
            codigo_barras: form.codigo_barras || null,
            qrcode: form.qrcode || null,
            categoria: form.categoria || null,
            imagem_url: form.imagem_url || null,
            preco: Number(form.preco || 0),
            preco_recebido: Number(form.preco_recebido || 0),
            disponivel: Number(form.disponivel),
            data_vencimento: form.data_vencimento || null
        };

        // produto simples
        if (tipo === "produto") {
            payload.unidade = form.unidade || null;
            payload.produto_id = null;
            payload.unidades = 0;
            payload.tempo_servico = null;
        }

        // pacote
        if (tipo === "pacote") {
            payload.produto_id = form.produto_id || null;
            payload.unidades = Number(form.unidades || 0);
            payload.unidade = null;
            payload.tempo_servico = null;
        }

        // serviço
        if (tipo === "servico") {
            payload.tempo_servico = form.tempo_servico || null;
            payload.unidade = null;
            payload.produto_id = null;
            payload.unidades = 0;
        }

        const url = item
            ? `${API_URL}/admin/produtos-servicos/${item.id}`
            : `${API_URL}/admin/produtos-servicos`;

        const resp = await fetch(url, {
            method: item ? "PUT" : "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const erro = await resp.json().catch(() => null);
            console.error("Erro ao salvar:", erro || await resp.text());
            return;
        }

        voltar();
    }

    function primeiraMaiuscula(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    return (
        <div className="form-produto">
            <div className="topo-form">
                <button onClick={voltar}>Voltar</button>
                <h4>{item ? "Editar item" : "Novo item"}</h4>
            </div>

            <div className="tipos">
                <button className={tipo === "produto" ? "ativo" : ""} onClick={() => setTipo("produto")}>Produto</button>
                <button className={tipo === "pacote" ? "ativo" : ""} onClick={() => setTipo("pacote")}>Pacote</button>
                <button className={tipo === "servico" ? "ativo" : ""} onClick={() => setTipo("servico")}>Serviço</button>
            </div>
            <div className="acoes">
                <button
                    className={`disponivel ${form.disponivel ? "on" : "off"}`}
                    onClick={() => alterar("disponivel", form.disponivel ? 0 : 1)}
                >
                    {form.disponivel ? "Disponível" : "Indisponível"}
                </button>

                <button className="salvar" onClick={salvar}>
                    Salvar
                </button>
            </div>
            <div className="grid">
                <input placeholder="Código de barras" value={form.codigo_barras} onChange={e => alterar("codigo_barras", e.target.value)} />
                <input placeholder="QRCode" value={form.qrcode} onChange={e => alterar("qrcode", e.target.value)} />

                <input
                    placeholder="Nome"
                    value={form.nome}
                    onChange={e => alterar("nome", primeiraMaiuscula(e.target.value))}
                />
                <input
                    list="lista-categorias"
                    placeholder="Categoria"
                    value={form.categoria}
                    onChange={e => alterar("categoria", primeiraMaiuscula(e.target.value))}
                />


                <datalist id="lista-categorias">
                    {categorias.map((cat, i) => (
                        <option key={i} value={cat} />
                    ))}
                </datalist>


                <input
                    placeholder="Preço"
                    value={form.preco}
                    onChange={e =>
                        alterar(
                            "preco",
                            e.target.value.replace(",", ".")
                        )
                    }
                />
                <input
                    placeholder="Preço recebido"
                    value={form.preco_recebido}
                    onChange={e =>
                        alterar(
                            "preco_recebido",
                            e.target.value.replace(",", ".")
                        )
                    }
                />

                {tipo === "produto" && (
                    <input placeholder="Unidade (ex: kg, un, caixa)" value={form.unidade} onChange={e => alterar("unidade", e.target.value)} />
                )}

                {tipo === "pacote" && (
                    <>
                        <input
                            list="lista-produtos"
                            placeholder="Produto base"
                            onChange={e => selecionarProdutoBase(e.target.value)}
                        />
                        <datalist id="lista-produtos">
                            {produtos.map(p => (
                                <option key={p.id} value={p.nome} />
                            ))}
                        </datalist>

                        <input
                            placeholder="Quantidade de unidades"
                            value={form.unidades}
                            onChange={e => alterar("unidades", e.target.value)}
                        />
                    </>
                )}

                {tipo === "servico" && (
                    <input
                        placeholder="Tempo de serviço (ex: 30 min)"
                        value={form.tempo_servico}
                        onChange={e => alterar("tempo_servico", e.target.value)}
                    />
                )}
                <input
                    type="date"
                    value={form.data_vencimento || ""}
                    onChange={e => alterar("data_vencimento", e.target.value)}
                    placeholder="Data de vencimento"
                />

            </div>

            <FormularioImagens
                valor={form.imagem_url}
                alterar={imgs => alterar("imagem_url", imgs)}
            />


        </div>
    );
}
