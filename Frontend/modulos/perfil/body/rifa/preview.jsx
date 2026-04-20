import React, { useState, useMemo, useEffect } from "react";
import "./preview.css";
import { API_URL } from "../../../../config";
import SorteioRifa from "./sorteio";
import StoryModal from "./storymodal";

export default function RifaPreview({ rifas = [], onSalvarNome }) {
    const [indexAtual, setIndexAtual] = useState(0);
    const [editando, setEditando] = useState(false);
    const [nomeEditavel, setNomeEditavel] = useState("");
    const [gerandoStory, setGerandoStory] = useState(false);
    const [storyAberta, setStoryAberta] = useState(false);

    // ===== ESTADOS EXISTENTES (MANTIDOS) =====
    const [compras, setCompras] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [compraSelecionada, setCompraSelecionada] = useState(null);

    const rifa =
        Array.isArray(rifas) && rifas.length > 0
            ? rifas[indexAtual]
            : null;

    // ===============================
    // BUSCAR NÚMEROS COMPRADOS
    // ===============================
    useEffect(() => {
        if (!rifa?.id) return;

        fetch(`${API_URL}/rifa/${rifa.id}/compras-detalhadas`)
            .then(r => r.json())
            .then(data => setCompras(Array.isArray(data) ? data : []))
            .catch(() => setCompras([]));
    }, [rifa]);

    // ===============================
    // INTERVALO
    // ===============================
    const intervalo = useMemo(() => {
        if (!rifa?.numeros) return "Intervalo indefinido";

        const partes = String(rifa.numeros).split("-");
        if (partes.length !== 2) return "Intervalo indefinido";

        return `De ${partes[0]} até ${partes[1]}`;
    }, [rifa]);

    // ===============================
    // TOTAL E RESTANTES
    // ===============================
    const totalNumeros = useMemo(() => {
        if (!rifa?.numeros) return 0;
        const [i, f] = rifa.numeros.split("-").map(Number);
        return f - i + 1;
    }, [rifa]);

    const numerosComprados = compras.map(c => c.numero);
    const restantes = totalNumeros - numerosComprados.length;

    // ===============================
    // VALORES FINANCEIROS
    // ===============================
    const totalBruto = useMemo(() => {
        if (!rifa) return 0;
        return Number(rifa.preco) * numerosComprados.length;
    }, [rifa, numerosComprados.length]);

    const taxa = useMemo(() => {
        return totalBruto * 0.06;
    }, [totalBruto]);

    const saldo = useMemo(() => {
        return totalBruto - taxa;
    }, [totalBruto, taxa]);

    const linkPublico = rifa
        ? `https://ironexecutions.com.br/rifa-compras/${rifa.id}`
        : "#";

    function iniciarEdicao() {
        if (!rifa) return;
        setNomeEditavel(rifa.nome || "");
        setEditando(true);
    }

    function cancelarEdicao() {
        setEditando(false);
        setNomeEditavel("");
    }

    async function salvarEdicao() {
        if (!rifa || !nomeEditavel.trim()) return;
        await onSalvarNome(rifa.id, nomeEditavel);
        setEditando(false);
    }

    function proximaRifa() {
        if (indexAtual < rifas.length - 1) {
            setIndexAtual(prev => prev + 1);
            setEditando(false);
        }
    }

    function rifaAnterior() {
        if (indexAtual > 0) {
            setIndexAtual(prev => prev - 1);
            setEditando(false);
        }
    }
    function podeMostrarSorteio(dataFim) {
        if (!dataFim) return false;

        // data atual no fuso do Brasil
        const agoraBrasil = new Date(
            new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        );

        // data fim da rifa (vinda do backend)
        const fimRifa = new Date(dataFim.replace(" ", "T"));

        return agoraBrasil > fimRifa;
    }

    function abrirModal(numero) {
        if (compraSelecionada?.numero === numero) {
            setCompraSelecionada(null);
            setModalAberto(false);
            return;
        }

        const compra = compras.find(c => c.numero === numero);
        if (!compra) return;

        setCompraSelecionada(compra);
        setModalAberto(true);
    }

    if (!rifa) {
        return (
            <div className="rifa-preview">
                <p>Nenhuma rifa cadastrada</p>
            </div>
        );
    }

    return (
        <div className="rifa-preview">

            {/* ===== HEADER ===== */}
            <div className="rifa-preview-header">
                {!editando ? (
                    <h4 onDoubleClick={iniciarEdicao}>{rifa.nome}</h4>
                ) : (
                    <div className="rifa-edicao">
                        <input
                            type="text"
                            value={nomeEditavel}
                            onChange={e => setNomeEditavel(e.target.value)}
                        />
                        <div className="rifa-edicao-acoes">
                            <button onClick={salvarEdicao}>Salvar</button>
                            <button
                                onClick={cancelarEdicao}
                                className="secundario"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== INFO ===== */}
            <div className="rifa-info">
                <span><strong>Prêmio:</strong> {rifa.premio}</span>
                <span><strong>Números:</strong> {intervalo}</span>
                <span>
                    <strong>Preço por número:</strong>{" "}
                    R$ {Number(rifa.preco).toFixed(2)}
                </span>
                <span>
                    <strong>Data final:</strong>{" "}
                    {new Date(rifa.data_fim).toLocaleString("pt-BR")}
                </span>
            </div>

            {/* ===== CONTADORES ===== */}
            <div className="rifa-contadores">
                <p><strong>Comprados:</strong> {numerosComprados.length}</p>
                <p><strong>Disponíveis:</strong> {restantes}</p>
            </div>

            {/* ===== FINANCEIRO ===== */}
            <div className="rifa-contadores">
                <p><strong>Total bruto:</strong> R$ {totalBruto.toFixed(2)}</p>
                <p><strong>Taxa 6%:</strong> R$ {taxa.toFixed(2)}</p>
                <p><strong>Saldo:</strong> R$ {saldo.toFixed(2)}</p>
            </div>

            {/* ===== NÚMEROS COMPRADOS ===== */}
            <div className="rifa-numeros-admin">
                {numerosComprados.length === 0 && (
                    <p>Nenhum número comprado ainda</p>
                )}

                {numerosComprados.map(n => {
                    const aberto =
                        modalAberto &&
                        compraSelecionada &&
                        compraSelecionada.numero === n;

                    return (
                        <div key={n} className="rifa-numero-bloco">
                            <div
                                className="rifa-numero-admin"
                                onClick={() => abrirModal(n)}
                            >
                                {n}
                            </div>

                            {aberto && (
                                <div className="rifa-numero-detalhes">
                                    <p><strong>Nome:</strong> {compraSelecionada.nome}</p>
                                    <p><strong>Email:</strong> {compraSelecionada.email}</p>
                                    <p><strong>WhatsApp:</strong> {compraSelecionada.whatsapp}</p>

                                    {compraSelecionada.mensagem && (
                                        <p>
                                            <strong>Mensagem:</strong>{" "}
                                            {compraSelecionada.mensagem}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ===== LINKS ===== */}
            <div className="rifa-links">
                <a href={linkPublico} target="_blank" rel="noreferrer">
                    Ver rifa pública
                </a>
            </div>
            <button
                className={`rifa-gerar-story ${gerandoStory ? "gerando" : ""}`}
                disabled={gerandoStory}
                onClick={async () => {
                    if (!rifa?.id || gerandoStory) return;

                    try {
                        setGerandoStory(true);

                        // copia link automaticamente
                        const link = `https://ironexecutions.com.br/rifa-compras/${rifa.id}`;
                        await navigator.clipboard.writeText(link);

                        // abre modal JSX (não chama backend)
                        setStoryAberta(true);

                    } finally {
                        setGerandoStory(false);
                    }
                }}
            >
                {gerandoStory
                    ? "Gerando..."
                    : "Gerar imagem para Stories e copiar o link publico"}
            </button>
            {storyAberta && (
                <StoryModal
                    rifa={rifa}
                    compras={compras}
                    onClose={() => setStoryAberta(false)}
                />
            )}

            <br /><br /><br /><br /><br /><br /><br /><br />
            {podeMostrarSorteio(rifa.data_fim) && (
                <SorteioRifa rifa={rifa} premio={rifa.premio} />
            )}

            {/* ===== NAVEGAÇÃO ===== */}
            <div className="rifa-navegacao">
                {indexAtual > 0 && (
                    <button className="ver-mais" onClick={rifaAnterior}>
                        Ver rifa anterior
                    </button>
                )}

                {indexAtual < rifas.length - 1 && (
                    <button className="ver-mais" onClick={proximaRifa}>
                        Ver próxima rifa
                    </button>
                )}
            </div>

        </div>
    );
}
