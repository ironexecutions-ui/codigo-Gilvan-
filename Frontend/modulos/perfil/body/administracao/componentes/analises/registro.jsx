import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../../../config";
import "./registro.css";
import EmojiPicker from "emoji-picker-react";

export default function Registro() {
    const topoFormRef = useRef(null);
    const [limite, setLimite] = useState(25);
    const [alertaAtivo, setAlertaAtivo] = useState(0);
    const [carregandoAlerta, setCarregandoAlerta] = useState(true);

    const modeloVazio = {
        dificuldade: "facil",
        idioma: "portugues",
        pergunta: "",
        a: "",
        b: "",
        c: "",
        d: "",
        resposta: "a"
    };
    const [modoEmoji, setModoEmoji] = useState(false);

    const [lista, setLista] = useState([]);
    const [form, setForm] = useState(modeloVazio);
    const [editandoId, setEditandoId] = useState(null);

    const [filtroIdioma, setFiltroIdioma] = useState("");
    const [filtroDificuldade, setFiltroDificuldade] = useState("");
    const [filtroTexto, setFiltroTexto] = useState("");
    function adicionarEmoji(emojiData) {
        setForm(prev => {
            const textoBase = prev.pergunta.trim();

            if (!textoBase) {
                return {
                    ...prev,
                    pergunta: `Adivinha o personagem ou historia: ${emojiData.emoji}`
                };
            }

            return {
                ...prev,
                pergunta: prev.pergunta + emojiData.emoji
            };
        });
    }
    useEffect(() => {
        async function carregarAlerta() {
            try {
                const r = await fetch(`${API_URL}/jogos/msb/alerta`);
                const res = await r.json();
                setAlertaAtivo(res.alerta);
            } catch {
                setAlertaAtivo(0);
            } finally {
                setCarregandoAlerta(false);
            }
        }

        carregarAlerta();
    }, []);
    async function alternarAlerta() {
        const novoValor = alertaAtivo === 1 ? 0 : 1;

        try {
            const r = await fetch(
                `${API_URL}/jogos/msb/alerta?alerta=${novoValor}`,
                { method: "POST" }
            );

            const res = await r.json();
            if (res.sucesso) {
                setAlertaAtivo(res.alerta);
            }
        } catch {
            alert("Erro ao atualizar alerta");
        }
    }


    /* =========================
       CARREGAR DADOS
    ========================= */
    function carregar() {
        fetch(`${API_URL}/jogos-quiz`)
            .then(r => r.json())
            .then(setLista);
    }

    useEffect(() => {
        carregar();
    }, []);

    /* =========================
       FORM
    ========================= */
    function alterarCampo(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function selecionarResposta(letra) {
        setForm(prev => ({ ...prev, resposta: letra }));
    }

    function salvar() {
        const metodo = editandoId ? "PUT" : "POST";
        const url = editandoId
            ? `${API_URL}/jogos-quiz/${editandoId}`
            : `${API_URL}/jogos-quiz`;

        fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        }).then(() => {
            setForm(modeloVazio);
            setEditandoId(null);
            carregar();
        });
    }

    function editar(item) {
        setForm({
            dificuldade: item.dificuldade,
            idioma: item.idioma,
            pergunta: item.pergunta,
            a: item.a,
            b: item.b,
            c: item.c,
            d: item.d,
            resposta: item.resposta
        });

        setEditandoId(item.id);

        setTimeout(() => {
            topoFormRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    }

    function cancelarEdicao() {
        setForm(modeloVazio);
        setEditandoId(null);
    }

    function apagar(id) {
        if (!window.confirm("Apagar esta pergunta?")) return;

        fetch(`${API_URL}/jogos-quiz/${id}`, { method: "DELETE" })
            .then(carregar);
    }

    /* =========================
       FILTROS + LIMITE
    ========================= */
    const listaFiltrada = lista
        .filter(q =>
            (!filtroIdioma || q.idioma === filtroIdioma) &&
            (!filtroDificuldade || q.dificuldade === filtroDificuldade) &&
            (!filtroTexto ||
                q.pergunta.toLowerCase().includes(filtroTexto.toLowerCase()))
        )
        .slice(0, limite);
    useEffect(() => {
        setLimite(25);
    }, [filtroIdioma, filtroDificuldade, filtroTexto]);
    function extrairEmojis(texto) {
        if (!texto) return [];
        return [...texto].filter(char => char.match(/\p{Emoji}/u));
    }

    return (
        <div className="quiz-reg-container">

            <div ref={topoFormRef} />

            <h2 className="quiz-reg-title">
                {editandoId ? "Editar Pergunta" : "Cadastrar Pergunta"}
            </h2>
            <div className="quiz-alerta-container">
                <button
                    className={`quiz-alerta-btn ${alertaAtivo === 1 ? "ativo" : "inativo"}`}
                    onClick={alternarAlerta}
                    disabled={carregandoAlerta}
                >
                    {alertaAtivo === 1 ? "🚨 Alerta ATIVADO" : "🔕 Alerta DESATIVADO"}
                </button>
            </div>

            {/* =========================
               FORMULÁRIO
            ========================= */}
            <div className="quiz-reg-form">

                <div className="quiz-reg-linha-dupla">
                    <select name="dificuldade" value={form.dificuldade} onChange={alterarCampo}>
                        <option value="facil">Fácil</option>
                        <option value="media">Média</option>
                        <option value="dificil">Difícil</option>
                    </select>

                    <select name="idioma" value={form.idioma} onChange={alterarCampo}>
                        <option value="portugues">Português</option>
                        <option value="espanhol">Espanhol</option>
                        <option value="ingles">Inglês</option>
                        <option value="frances">Francês</option>
                    </select>
                </div>

                <div className="quiz-pergunta-container">
                    {extrairEmojis(form.pergunta).length > 0 && (
                        <div className="quiz-emojis-usados">
                            <span className="quiz-emojis-label">Emojis adicionados:</span>

                            <div className="quiz-emojis-lista">
                                {extrairEmojis(form.pergunta).map((emoji, index) => (
                                    <span key={index} className="quiz-emoji-item">
                                        {emoji}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {!modoEmoji && (
                        <>
                            <textarea
                                name="pergunta"
                                placeholder="Digite a pergunta completa"
                                value={form.pergunta}
                                onChange={alterarCampo}
                            />

                            <button
                                type="button"
                                className="quiz-btn-emoji"
                                onClick={() => setModoEmoji(true)}
                            >
                                😊
                            </button>
                        </>
                    )}

                    {modoEmoji && (
                        <div className="quiz-emoji-area">
                            <EmojiPicker
                                onEmojiClick={adicionarEmoji}
                                searchPlaceholder="Buscar emoji..."
                                width="100%"
                            />

                            <button
                                type="button"
                                className="quiz-btn-voltar-texto"
                                onClick={() => setModoEmoji(false)}
                            >
                                Voltar ao texto
                            </button>
                        </div>
                    )}

                </div>


                <div className="quiz-opcoes-grid">
                    {["a", "b", "c", "d"].map(letra => (
                        <div
                            key={letra}
                            className={`quiz-opcao-card ${form.resposta === letra ? "ativa" : ""}`}
                            onClick={() => selecionarResposta(letra)}
                        >
                            <div className="quiz-opcao-header">
                                <input
                                    type="radio"
                                    checked={form.resposta === letra}
                                    readOnly
                                />
                                <span className="quiz-opcao-letra">
                                    {letra.toUpperCase()}
                                </span>
                            </div>

                            <input
                                name={letra}
                                placeholder={`Digite a opção ${letra.toUpperCase()}`}
                                value={form[letra]}
                                onChange={alterarCampo}
                                style={{
                                    width: "100%",
                                    height: "56px",
                                    padding: "14px 16px",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    color: "black",
                                    border: "none",
                                    borderRadius: "12px",
                                    backgroundColor: "transparent",
                                    boxSizing: "border-box",
                                    outline: "none"
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="quiz-reg-acoes">
                    <button className="quiz-btn-salvar" onClick={salvar}>
                        {editandoId ? "Salvar alterações" : "Cadastrar pergunta"}
                    </button>

                    {editandoId && (
                        <button
                            className="quiz-btn-cancelar"
                            onClick={cancelarEdicao}
                        >
                            Cancelar edição
                        </button>
                    )}
                </div>
            </div>

            {/* =========================
               FILTROS
            ========================= */}
            <div className="quiz-reg-filtros quiz-reg-linha-dupla">
                <select value={filtroIdioma} onChange={e => setFiltroIdioma(e.target.value)}>
                    <option value="">Todos os idiomas</option>
                    <option value="portugues">Português</option>
                    <option value="espanhol">Espanhol</option>
                    <option value="ingles">Inglês</option>
                    <option value="frances">Francês</option>
                </select>

                <select
                    value={filtroDificuldade}
                    onChange={e => setFiltroDificuldade(e.target.value)}
                >
                    <option value="">Todas as dificuldades</option>
                    <option value="facil">Fácil</option>
                    <option value="media">Média</option>
                    <option value="dificil">Difícil</option>
                </select>
            </div>

            <input
                className="quiz-reg-busca"
                placeholder="Buscar por texto da pergunta..."
                value={filtroTexto}
                onChange={e => setFiltroTexto(e.target.value)}
            />

            {/* =========================
               TABELA
            ========================= */}
            <table className="quiz-reg-table">
                <thead>
                    <tr>
                        <th>Dificuldade</th>
                        <th>Idioma</th>
                        <th>Pergunta</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {listaFiltrada.map(q => (
                        <tr key={q.id}>
                            <td>{q.dificuldade}</td>
                            <td>{q.idioma}</td>
                            <td className="quiz-pergunta">{q.pergunta}</td>
                            <td>
                                <button
                                    className="quiz-btn-editar"
                                    onClick={() => editar(q)}
                                >
                                    Editar
                                </button>
                                <button
                                    className="quiz-btn-apagar"
                                    onClick={() => apagar(q.id)}
                                >
                                    Apagar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {listaFiltrada.length < lista.filter(q =>
                    (!filtroIdioma || q.idioma === filtroIdioma) &&
                    (!filtroDificuldade || q.dificuldade === filtroDificuldade) &&
                    (!filtroTexto || q.pergunta.toLowerCase().includes(filtroTexto.toLowerCase()))
                ).length && (
                        <div style={{ marginTop: 24, textAlign: "center" }}>
                            <button
                                className="quiz-btn-carregar"
                                onClick={() => setLimite(prev => prev + 25)}
                            >
                                Carregar mais
                            </button>
                        </div>
                    )}

            </table>

        </div>
    );
}
