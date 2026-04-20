import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../config";
import "./anotacoes.css";

export default function Anotacoes() {

    const editorRef = useRef(null);

    const [lista, setLista] = useState([]);
    const [ativa, setAtiva] = useState(null);
    const [editandoNome, setEditandoNome] = useState(null);
    const [novoNome, setNovoNome] = useState("");
    const [modoEdicao, setModoEdicao] = useState(false);
    const [tamanhoFonte, setTamanhoFonte] = useState(16);
    const [boldAtivo, setBoldAtivo] = useState(false);
    const [underlineAtivo, setUnderlineAtivo] = useState(false);
    const [alinhamento, setAlinhamento] = useState("left");
    const ignorarSelecaoRef = useRef(false);
    const [arrastando, setArrastando] = useState(null);
    const [emArquivados, setEmArquivados] = useState(false);

    useEffect(() => {
        carregarLista();
    }, []);

    async function carregarLista() {
        const r = await fetch(`${API_URL}/anotacoes`);
        const j = await r.json();
        if (j.ok) {
            setLista(j.anotacoes);
            setEmArquivados(false);
        }
    }

    function iniciarArraste(index) {
        setArrastando(index);
    }

    function entrarSobre(index) {
        if (arrastando === null || arrastando === index) return;

        const novaLista = [...lista];
        const itemMovido = novaLista.splice(arrastando, 1)[0];
        novaLista.splice(index, 0, itemMovido);

        setArrastando(index);
        setLista(novaLista);
    }

    async function soltar() {
        setArrastando(null);

        const ordenado = lista.map((item, index) => ({
            id: item.id,
            posicao: index + 1
        }));

        await fetch(`${API_URL}/anotacoes/ordenar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lista: ordenado })
        });
    }

    async function abrirAnotacao(id, editar = false) {

        setAtiva(id);   // <-- força atualização imediata

        const r = await fetch(`${API_URL}/anotacoes/${id}`);
        const j = await r.json();

        if (j.ok) {
            setModoEdicao(editar);

            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = j.anotacao.conteudo || "";
                }
            }, 0);
        }
    }

    function alinharEsquerda() {
        if (!modoEdicao) return;
        document.execCommand("justifyLeft", false, null);
    }
    function atualizarEstadoSelecao() {
        if (!modoEdicao) return;
        if (ignorarSelecaoRef.current) return;

        setBoldAtivo(document.queryCommandState("bold"));
        setUnderlineAtivo(document.queryCommandState("underline"));

        if (document.queryCommandState("justifyCenter")) {
            setAlinhamento("center");
        } else {
            setAlinhamento("left");
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        let node = selection.focusNode;
        if (!node) return;

        if (node.nodeType === 3) {
            node = node.parentElement;
        }

        if (node instanceof HTMLElement) {
            const tamanho = window.getComputedStyle(node).fontSize;
            const px = parseInt(tamanho.replace("px", ""));
            if (!isNaN(px)) {
                setTamanhoFonte(px);
            }
        }
    }

    useEffect(() => {
        document.addEventListener("selectionchange", atualizarEstadoSelecao);

        return () => {
            document.removeEventListener("selectionchange", atualizarEstadoSelecao);
        };
    }, [modoEdicao]);

    async function criarNova() {
        const nome = prompt("Nome da anotação");
        if (!nome) return;

        await fetch(`${API_URL}/anotacoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome })
        });

        carregarLista();
    }

    function aplicarCheckbox() {
        if (!modoEdicao) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // container temporário
        const fragment = range.cloneContents();
        const div = document.createElement("div");
        div.appendChild(fragment);

        const linhas = [];

        // pega cada bloco ou linha
        div.childNodes.forEach(node => {
            if (node.nodeType === 3 && node.textContent.trim()) {
                linhas.push(node.textContent);
            }

            if (node.nodeType === 1) {
                if (node.tagName === "DIV" || node.tagName === "P") {
                    linhas.push(node.innerText);
                } else {
                    linhas.push(node.textContent);
                }
            }
        });

        if (linhas.length === 0) return;

        const html = linhas.map(linha => {
            if (!linha.trim()) return "";

            return `
            <div class="linha-check">
                <input type="checkbox" onclick="this.parentElement.classList.toggle('feito')">
                <div class="linha-texto">${linha}</div>
            </div>
        `;
        }).join("");

        // remove o conteúdo original
        range.deleteContents();

        // insere os checkboxes corretamente separados
        document.execCommand("insertHTML", false, html);
    }

    function aplicarTamanhoFonte(novoTamanho) {
        if (!modoEdicao) return;

        ignorarSelecaoRef.current = true;

        document.execCommand("fontSize", false, 7);

        const fontes = editorRef.current.querySelectorAll("font[size='7']");
        fontes.forEach(f => {
            f.removeAttribute("size");
            f.outerHTML = `<span style="font-size:${novoTamanho}px">${f.innerHTML}</span>`;
        });

        setTamanhoFonte(novoTamanho);

        setTimeout(() => {
            ignorarSelecaoRef.current = false;
        }, 0);
    }


    function aumentarFonte() {
        aplicarTamanhoFonte(tamanhoFonte + 2);
    }

    function diminuirFonte() {
        if (tamanhoFonte <= 10) return;
        aplicarTamanhoFonte(tamanhoFonte - 2);
    }

    async function salvar() {
        if (!ativa) return;

        const html = editorRef.current.innerHTML;

        await fetch(`${API_URL}/anotacoes/${ativa}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conteudo: html })
        });

        setModoEdicao(false);
        alert("Anotação salva");
    }

    async function apagar(id) {
        if (!window.confirm("Apagar esta anotação?")) return;

        await fetch(`${API_URL}/anotacoes/${id}`, {
            method: "DELETE"
        });

        setAtiva(null);
        setModoEdicao(false);
        carregarLista();
    }

    async function salvarNome(id) {
        await fetch(`${API_URL}/anotacoes/nome/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: novoNome })
        });

        setEditandoNome(null);
        carregarLista();
    }

    function comando(cmd) {
        if (!modoEdicao) return;
        document.execCommand(cmd, false, null);
    }

    function centralizar() {
        if (!modoEdicao) return;
        document.execCommand("justifyCenter", false, null);
    }
    async function abrirArquivados() {
        const senha = prompt("Área restrita. Digite a senha:");
        if (!senha) return;

        const r = await fetch(`${API_URL}/anotacoes/arquivados/verificar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senha })
        });

        const j = await r.json();

        if (!j.ok) {
            alert(j.erro);
            return;
        }

        setLista(j.anotacoes || []);
        setAtiva(null);
        setModoEdicao(false);
        setEmArquivados(true);
    }


    return (
        <div className="anotacoes-container">

            <aside className="anotacoes-lista">
                <h3>Anotações</h3>
                {Array.isArray(lista) && lista.length > 0 && lista[0].arquivado === 1 && (
                    <div className="aviso-admin">
                        Área restrita. Acesso somente autorizado.
                    </div>

                )}
                {emArquivados && (
                    <button
                        className="btn-voltar"
                        onClick={carregarLista}
                    >
                        ← Voltar para anotações
                    </button>
                )}



                <button
                    className="btn-arquivados"
                    onClick={() => abrirArquivados()}
                >
                    Informação sensivel
                </button>

                <button className="btn-nova" onClick={criarNova}>
                    + Nova anotação
                </button>

                {lista.map((a, i) => (
                    <div
                        key={a.id}
                        className={`item-anotacao ${arrastando === i ? "arrastando" : ""}`}
                        draggable
                        onDragStart={() => iniciarArraste(i)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            entrarSobre(i);
                        }}
                        onDragEnd={soltar}
                    >

                        {editandoNome === a.id ? (
                            <>
                                <input
                                    value={novoNome}
                                    onChange={e => setNovoNome(e.target.value)}
                                />
                                <button onClick={() => salvarNome(a.id)}>
                                    Salvar
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        // sempre abre a anotação ao clicar
                                        abrirAnotacao(a.id, true);

                                        // entra em edição do nome só se realmente quiser
                                        setEditandoNome(a.id);
                                        setNovoNome(a.nome);
                                    }}
                                >
                                    {a.nome}
                                </button>


                                <div className="acoes">


                                    <span onClick={() => apagar(a.id)}>
                                        🗑️
                                    </span>
                                </div>
                            </>
                        )}

                    </div>
                ))}
            </aside>

            <section className="anotacoes-editor">

                {ativa ? (
                    <>
                        {modoEdicao && (
                            <div className="editor-botoes">
                                <button
                                    onClick={() => comando("bold")}
                                    style={{ color: boldAtivo ? "#2ecc71" : "#ffffff" }}
                                >
                                    Negrito
                                </button>

                                <button
                                    onClick={() => comando("underline")}
                                    style={{ color: underlineAtivo ? "#2ecc71" : "#ffffff" }}
                                >
                                    Underline
                                </button>

                                <button
                                    onClick={centralizar}
                                    style={{ color: alinhamento === "center" ? "#2ecc71" : "#ffffff" }}
                                >
                                    Centralizar
                                </button>

                                <button
                                    onClick={alinharEsquerda}
                                    style={{ color: alinhamento === "left" ? "#2ecc71" : "#ffffff" }}
                                >
                                    Esquerda
                                </button>

                                <div className="controle-fonte">
                                    <button onClick={diminuirFonte}>A−</button>

                                    <span className="tamanho-fonte">
                                        {tamanhoFonte}px
                                    </span>

                                    <button onClick={aumentarFonte}>A+</button>
                                    <button onClick={aplicarCheckbox}>
                                        Checkbox
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!ativa) return;

                                            const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

                                            await fetch(`${API_URL}/anotacoes/arquivar`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ id: ativa })
                                            });

                                            setAtiva(null);
                                            setModoEdicao(false);
                                            carregarLista();
                                            alert("Anotação arquivada");
                                        }}
                                        style={{ color: "#ffbf00", marginLeft: "30px" }}
                                    >
                                        Mover para área sensivel
                                    </button>
                                    {modoEdicao && (
                                        <button className="btn-salvar" onClick={salvar}>
                                            Salvar
                                        </button>
                                    )}
                                </div>

                            </div>
                        )}

                        <div
                            ref={editorRef}
                            contentEditable={modoEdicao}
                            className={`editor-area ${modoEdicao ? "editando" : "visualizando"}`}
                        ></div>

                        {modoEdicao && (
                            <button className="btn-salvar" onClick={salvar}>
                                Salvar
                            </button>
                        )}
                    </>
                ) : (
                    <p>Selecione uma anotação</p>
                )}

            </section>
        </div>
    );
}
