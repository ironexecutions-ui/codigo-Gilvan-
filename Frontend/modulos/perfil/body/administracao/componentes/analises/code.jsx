import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../../../../../config";
import "./code.css";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export default function Code() {

    const [modo, setModo] = useState("codigo_barras");
    const [produtos, setProdutos] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const areaImpressaoRef = useRef();
    const [categorias, setCategorias] = useState([]);
    const [categoriasAtivas, setCategoriasAtivas] = useState([]);
    const [gerando, setGerando] = useState(false);
    const [carregandoLista, setCarregandoLista] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!modo) return;

        setCarregandoLista(true);

        fetch(`${API_URL}/admin/codigos/produtos`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(dados => {
                setProdutos(dados);

                const cats = [...new Set(
                    dados
                        .map(p => p.categoria)
                        .filter(Boolean)
                )];

                setCategorias(cats);
            })
            .finally(() => {
                setCarregandoLista(false);
            });
    }, [modo]);


    function unidadeProduto(p) {
        if (p.unidade && p.unidade.trim() !== "") {
            return p.unidade;
        }

        if (p.unidades !== null && p.unidades !== undefined) {
            return "Pacote de " + p.unidades + " Unidades";
        }

        if (p.tempo_servico) {
            return p.tempo_servico;
        }

        return "sem unidade definida";
    }

    function toggleCategoria(cat) {
        setCategoriasAtivas(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    }

    function moverProduto(p) {
        setSelecionados(prev => [...prev, p]);
        setProdutos(prev => prev.filter(i => i.id !== p.id));
    }

    async function designar() {
        if (gerando) return;

        const ids = selecionados
            .filter(p => !p[modo])
            .map(p => p.id);

        if (!ids.length) return;

        setGerando(true);

        try {
            await fetch(`${API_URL}/admin/codigos/designar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ids, tipo: modo })
            });

            const resp = await fetch(`${API_URL}/admin/codigos/produtos`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const dadosAtualizados = await resp.json();

            setProdutos(dadosAtualizados.filter(p =>
                !selecionados.some(s => s.id === p.id)
            ));

            setSelecionados(prev =>
                prev.map(sel =>
                    dadosAtualizados.find(p => p.id === sel.id) || sel
                )
            );

        } finally {
            setGerando(false);
        }
    }


    function imprimir() {
        if (!selecionados.length) return;

        const win = window.open("about:blank", "_blank", "width=800,height=600");

        if (!win) {
            alert("Popup bloqueado pelo navegador");
            return;
        }

        win.document.open();
        win.document.write(`
        <html>
            <head>
                <title>Impressão</title>
                <style>
                    body {
                        font-family: Arial;
                        padding: 20px;
                    }
                    .etiqueta {
                        width: 280px;
                        margin-bottom: 40px;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .nome {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 8px;
                    }
                </style>
            </head>
            <body>
                <div id="conteudo">Preparando impressão...</div>
            </body>
        </html>
    `);
        win.document.close();

        // NÃO use onload aqui
        setTimeout(() => {
            gerarConteudoImpressao(win);
        }, 50);
    }
    async function gerarConteudoImpressao(win) {
        const container = win.document.getElementById("conteudo");
        if (!container) return;

        container.innerHTML = "";

        for (const p of selecionados) {

            const etiqueta = win.document.createElement("div");
            etiqueta.className = "etiqueta";

            const nome = win.document.createElement("div");
            nome.className = "nome";
            nome.textContent = p.nome || "";

            etiqueta.appendChild(nome);

            if (modo === "qrcode") {

                if (!p.qrcode) continue;

                const svgQR = await QRCode.toString(
                    String(p.qrcode),
                    { type: "svg", width: 120, margin: 1 }
                );

                etiqueta.insertAdjacentHTML("beforeend", svgQR);

            } else {

                if (!p.codigo_barras) continue;

                const svg = win.document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );

                const codigo = String(p.codigo_barras);
                const formato = validarEAN13(codigo) ? "EAN13" : "CODE128";

                JsBarcode(svg, codigo, {
                    format: formato,
                    displayValue: false,
                    height: 70,
                    margin: 0
                });


                etiqueta.appendChild(svg);
            }

            container.appendChild(etiqueta);
        }

        // garante renderização completa antes da impressão
        win.requestAnimationFrame(() => {
            win.requestAnimationFrame(() => {
                win.focus();
                win.print();
            });
        });
    }

    function validarEAN13(codigo) {
        if (!/^\d{13}$/.test(codigo)) return false;

        let soma = 0;
        for (let i = 0; i < 12; i++) {
            soma += Number(codigo[i]) * (i % 2 === 0 ? 1 : 3);
        }

        const digito = (10 - (soma % 10)) % 10;
        return digito === Number(codigo[12]);
    }


    function removerProduto(p) {
        setProdutos(prev => [...prev, p]);
        setSelecionados(prev => prev.filter(i => i.id !== p.id));
    }

    const produtosFiltrados = categoriasAtivas.length
        ? produtos.filter(p => categoriasAtivas.includes(p.categoria))
        : produtos;
    function moverSemCodigo() {
        const semCodigo = produtos.filter(p => !p[modo]);

        if (!semCodigo.length) return;

        setSelecionados(prev => [...prev, ...semCodigo]);

        setProdutos(prev =>
            prev.filter(p => p[modo])
        );
    }

    function moverTodosVisiveis() {
        if (!produtosFiltrados.length) return;

        setSelecionados(prev => [...prev, ...produtosFiltrados]);

        setProdutos(prev =>
            prev.filter(p =>
                !produtosFiltrados.some(v => v.id === p.id)
            )
        );
    }

    return (
        <div className="codigos-container">

            {/* TOPO */}
            <div className="codigos-topo">
                <button
                    className={modo === "codigo_barras" ? "ativo" : ""}
                    onClick={() => setModo("codigo_barras")}
                >
                    Código de Barras
                </button>

                <button
                    className={modo === "qrcode" ? "ativo" : ""}
                    onClick={() => setModo("qrcode")}
                >
                    QR Code
                </button>
            </div>

            {modo && (
                <div className="listas">

                    {/* LISTA ESQUERDA */}
                    <div className="lista">

                        <div className="lista-header">
                            <h4>Produtos</h4>
                            <button
                                className="btn-sem-codigo"
                                onClick={moverSemCodigo}
                                disabled={produtos.filter(p => !p[modo]).length === 0}
                            >
                                Mover itens sem código
                            </button>
                            <button
                                className="btn-sem-codigo"
                                onClick={moverTodosVisiveis}
                                disabled={produtosFiltrados.length === 0}
                            >
                                Mover todos os itens visíveis
                            </button>
                            {categorias.length > 0 && (
                                <div className="categorias-filtro">
                                    {categorias.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategoria(cat)}
                                            className={categoriasAtivas.includes(cat) ? "ativo" : ""}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {(gerando || carregandoLista) && (
                            <div className="code-overlay-gerando">
                                <div className="code-box-gerando">
                                    <div className="code-spinner" />
                                    <span>
                                        {gerando ? "Gerando códigos..." : "Carregando produtos..."}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="lista-body">
                            {produtosFiltrados.map(p => (
                                <div key={p.id} className="linha">
                                    <div className="linha-info">
                                        <span className="nome-produto">{p.nome}</span>
                                        <span className="unidade-produto">
                                            {unidadeProduto(p)}
                                        </span>
                                        <span
                                            className={`codigo-produto ${!p[modo] ? "sem-codigo" : ""}`}
                                        >
                                            {p[modo] || "Sem código"}
                                        </span>

                                    </div>

                                    <button
                                        className="btn-mover"
                                        onClick={() => moverProduto(p)}
                                    >
                                        ➜
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LISTA DIREITA */}
                    <div className="lista selecionados">

                        <div className="lista-header fixo">
                            <h4>Selecionados</h4>

                            <div className="acoes">
                                <button
                                    onClick={designar}
                                    disabled={gerando || selecionados.length === 0}
                                >
                                    {gerando ? "Gerando..." : "Designar código"}
                                </button>


                                <button
                                    onClick={() => imprimir()}
                                    disabled={selecionados.length === 0}
                                >
                                    Imprimir
                                </button>


                            </div>
                        </div>

                        <div className="lista-body">
                            {selecionados.map(p => (
                                <div key={p.id} className="linha">
                                    <div className="linha-info">
                                        <span className="nome-produto">{p.nome}</span>
                                        <span className="unidade-produto">
                                            {unidadeProduto(p)}
                                        </span>
                                        <span className="codigo-produto">
                                            {p[modo] || "Sem código"}
                                        </span>
                                    </div>

                                    <button
                                        className="btn-remover"
                                        onClick={() => removerProduto(p)}
                                        title="Remover da lista"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}



        </div>
    );

}
