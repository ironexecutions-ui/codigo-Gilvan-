import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { URL } from "../../url";
import "./modalproduto.css";

export default function ModalProduto({ produto, fechar, atualizar }) {
    const token = localStorage.getItem("token");

    /* =========================
       STATES
    ========================= */
    const [tipo, setTipo] = useState("produto");
    const [categorias, setCategorias] = useState([]);
    const [disponivel, setDisponivel] = useState(produto ? produto.disponivel === 1 : true);
    const formRef = useRef(null);

    const [produtosBase, setProdutosBase] = useState([]);
    const [produtoPacoteBusca, setProdutoPacoteBusca] = useState("");
    const [produtoPacoteId, setProdutoPacoteId] = useState(null);

    const produtoVazio = {
        nome: "",
        codigo_barras: "",
        unidade: "",
        unidades: "",
        tempo_servico: "",
        preco: "",
        preco_recebido: "",
        categoria: "",
        imagem_url: "",
        disponivel: 1
    };
    function normalizarProduto(p) {
        return {
            nome: p?.nome ?? "",
            codigo_barras: p?.codigo_barras ?? "",
            unidade: p?.unidade ?? "",
            unidades: p?.unidades ?? "",
            tempo_servico: p?.tempo_servico ?? "",
            preco: p?.preco ?? "",
            preco_recebido: p?.preco_recebido ?? "",
            categoria: p?.categoria ?? "",
            imagem_url: p?.imagem_url ?? "",
            disponivel: p?.disponivel ?? 1
        };
    }


    const [form, setForm] = useState(
        produto ? normalizarProduto(produto) : produtoVazio
    );

    /* =========================
       INIT
    ========================= */
    useEffect(() => {
        carregarCategorias();
        carregarProdutosBase();

        if (produto) {
            if (produto.produto_id > 0) setTipo("pacote");
            else if (!produto.unidade && produto.tempo_servico) setTipo("servico");
            else setTipo("produto");
        }

    }, []);

    /* =========================
       HELPERS
    ========================= */
    function alterar(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }));
    }

    function resolverProdutoPacote(valor) {
        setProdutoPacoteBusca(valor);

        if (!valor) {
            setProdutoPacoteId(null);
            return;
        }

        const soNumero = /^\d+$/.test(valor);

        const encontrado = produtosBase.find(p =>
            soNumero
                ? p.codigo_barras === valor
                : p.nome.toLowerCase() === valor.toLowerCase()
        );

        setProdutoPacoteId(encontrado ? encontrado.id : null);
    }
    function handleEnter(e) {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const inputs = Array.from(
            formRef.current.querySelectorAll(
                "input:not([disabled]), textarea, select"
            )
        ).filter(el => el.offsetParent !== null);

        const index = inputs.indexOf(e.target);

        if (index === -1) return;

        const proximo = inputs[index + 1];

        if (proximo) {
            proximo.focus();
        } else {
            salvar();
        }
    }

    /* =========================
       LOADERS
    ========================= */
    async function carregarCategorias() {
        const resp = await fetch(
            `${URL}/produtos_servicos_tabela/categorias`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();
        setCategorias(Array.isArray(json) ? json : []);
    }

    async function carregarProdutosBase() {
        const resp = await fetch(
            `${URL}/produtos_servicos_tabela`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();

        if (Array.isArray(json)) {
            // somente produtos reais (com unidade)
            setProdutosBase(json.filter(p => p.unidade));
        }
    }


    /* =========================
       UPLOADS
    ========================= */
    async function uploadImagemPrincipal(file) {
        if (!file) return;

        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("pasta", "produtos");

        const resp = await fetch(`${URL}/upload/client/imagem`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const json = await resp.json();

        if (!json.ok) {
            alert("Erro ao enviar imagem");
            return;
        }

        alterar("imagem_url", json.url);
    }

    async function uploadImagensExtras(files) {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (const file of files) {
            formData.append("arquivos", file);
        }
        formData.append("pasta", "produtos");
        console.log("ENVIANDO PARA O BANCO:", form.imagem_url);

        const resp = await fetch(`${URL}/upload/client/imagens`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const json = await resp.json();

        if (!json.ok) {
            alert("Erro ao enviar imagens");
            return;
        }

        const linksNovos = json.urls.join("|");

        setForm(prev => ({
            ...prev,
            imagem_url: prev.imagem_url
                ? prev.imagem_url + "|" + linksNovos
                : linksNovos
        }));

    }
    async function removerImagem(url) {
        if (!confirm("Remover esta imagem?")) return;

        // remove do estado local
        setForm(prev => {
            const lista = prev.imagem_url
                .split("|")
                .filter(u => u && u !== url);

            return {
                ...prev,
                imagem_url: lista.join("|")
            };
        });

        // pede para o backend apagar do Supabase
        await fetch(`${URL}/upload/client/imagem`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });
    }


    /* =========================
       SAVE
    ========================= */
    async function salvar() {
        const payload = {
            ...form,
            disponivel: disponivel ? 1 : 0
        };
        console.log("PAYLOAD FINAL PARA O BANCO:", payload.imagem_url);

        if (tipo === "pacote") {
            if (!produtoPacoteId) {
                alert("Selecione um produto válido para o pacote");
                return;
            }
            payload.produto_id = produtoPacoteId;
            payload.unidade = null;
            payload.tempo_servico = null;
        }

        if (tipo === "produto") {
            payload.unidades = null;
            payload.tempo_servico = null;
        }

        if (tipo === "servico") {
            payload.unidade = null;
            payload.unidades = null;
        }

        const url = produto
            ? `${URL}/produtos_servicos_tabela/${produto.id}`
            : `${URL}/produtos_servicos_tabela`;

        const method = produto ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        atualizar();
        fechar();
    }
    const imagensExtrasLista = form.imagem_url
        ? form.imagem_url.split("|").filter(Boolean)
        : [];

    /* =========================
       RENDER
    ========================= */
    return createPortal(
        <div className="mp-overlay">
            <div className="mp-modal">

                <div className="mp-header">
                    <h2>{produto ? "Editar item" : "Adicionar item"}</h2>
                    <button onClick={fechar}>✕</button>
                </div>

                <div className="mp-tipos">
                    <button onClick={() => setTipo("produto")} className={tipo === "produto" ? "ativo" : ""}>Produto</button>
                    <button onClick={() => setTipo("pacote")} className={tipo === "pacote" ? "ativo" : ""}>Pacote</button>
                    <button onClick={() => setTipo("servico")} className={tipo === "servico" ? "ativo" : ""}>Serviço</button>
                </div>

                <div className="mp-formm" ref={formRef} onKeyDown={handleEnter}>

                    <label>Nome</label>
                    <input value={form.nome} onChange={e => alterar("nome", e.target.value)} />

                    <label>Código de barras</label>
                    <input style={{ textAlign: "center" }} value={form.codigo_barras || ""} onChange={e => alterar("codigo_barras", e.target.value)} />

                    {tipo === "pacote" && (
                        <>
                            <label>Produto do pacote</label>
                            <input
                                list="produtos-base"
                                placeholder="Nome ou código de barras"
                                value={produtoPacoteBusca}
                                onChange={e => resolverProdutoPacote(e.target.value)}
                            />
                            <datalist id="produtos-base">
                                {produtosBase.map(p => (
                                    <option key={p.id} value={p.nome} />
                                ))}
                            </datalist>

                            <label>Unidades</label>
                            <input style={{ textAlign: "center" }} type="number" value={form.unidades || ""} onChange={e => alterar("unidades", e.target.value)} />
                        </>
                    )}

                    {tipo === "produto" && (
                        <>
                            <label>Unidade</label>
                            <input value={form.unidade || ""} onChange={e => alterar("unidade", e.target.value)} />
                        </>
                    )}

                    {tipo === "servico" && (
                        <>
                            <label>Tempo de serviço</label>
                            <input value={form.tempo_servico || ""} onChange={e => alterar("tempo_servico", e.target.value)} />
                        </>
                    )}

                    <label>Preço</label>
                    <input style={{ textAlign: "center" }} type="number" value={form.preco || ""} onChange={e => alterar("preco", e.target.value)} />

                    <label>Preço recebido</label>
                    <input style={{ textAlign: "center" }} type="number" value={form.preco_recebido || ""} onChange={e => alterar("preco_recebido", e.target.value)} />

                    <label>Categoria</label>
                    <input list="categorias" value={form.categoria || ""} onChange={e => alterar("categoria", e.target.value)} />
                    <datalist id="categorias">
                        {categorias.map(c => <option key={c} value={c} />)}
                    </datalist>

                    <div
                        className={`mp-disponivel ${disponivel ? "on" : "off"}`}
                        onClick={() => setDisponivel(!disponivel)}
                    >
                        {disponivel ? "Disponível" : "Indisponível"}
                    </div>

                    <label>Imagem principal</label>
                    <div
                        className="mp-imagem-drop"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                            e.preventDefault();
                            uploadImagemPrincipal(e.dataTransfer.files[0]);
                        }}
                    >
                        {form.imagem_url ? <img src={form.imagem_url} /> : "Arraste a imagem aqui"}
                    </div>

                    <label>todas as magens</label>
                    <div className="mp-imagens-extras">
                        {imagensExtrasLista.map((url, i) => (
                            <div className="mp-imagem-wrapper" key={i}>
                                <img src={url} />

                                <button
                                    className="mp-remover-img"
                                    onClick={() => removerImagem(url)}
                                    title="Remover imagem"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <div
                            className="mp-imagem-extra-drop"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                uploadImagensExtras(e.dataTransfer.files);
                            }}
                        >
                            Arraste aqui
                        </div>
                    </div>


                </div>

                <div className="mp-footer">
                    <button onClick={salvar}>Salvar</button>
                </div>

            </div>
        </div>,
        document.body
    );
}
