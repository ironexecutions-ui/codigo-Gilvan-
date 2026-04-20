import React, { useRef, useState, useEffect } from "react";
import { API_URL } from "../../../config";
import "./paletacores.css";

export default function PaletaCores() {

    const canvasRef = useRef(null);
    const [statusEnvio, setStatusEnvio] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [quadros, setQuadros] = useState([]);
    const [quadroId, setQuadroId] = useState(null);

    const [fase, setFase] = useState(null); // null | nome | quadros | letras | cores
    const [nomeQuadro, setNomeQuadro] = useState("");

    const [formas, setFormas] = useState([]);
    const [formaAtiva, setFormaAtiva] = useState(null);

    const [fundoQuadro, setFundoQuadro] = useState("#0e0e0e");

    const [inicio, setInicio] = useState(null);
    const [preview, setPreview] = useState(null);

    /* =========================
       CARREGAR QUADROS
    ========================= */

    async function carregarQuadros() {
        const r = await fetch(`${API_URL}/paleta/quadros`);
        const j = await r.json();
        if (j.ok) setQuadros(j.quadros);
    }

    async function carregarFormas(id) {
        const r = await fetch(`${API_URL}/paleta/formas/${id}`);
        const j = await r.json();

        if (j.ok) {
            setFormas(j.formas.map(f => ({
                id: Number(f.id) > 0 && Number(f.id) < 1000000000 ? Number(f.id) : null,
                x: f.pos_x,
                y: f.pos_y,
                w: f.largura,
                h: f.altura,
                cor: f.cor_forma,
                texto: f.texto || "",
                tamanhoTexto: f.tamanho_texto,
                corTexto: f.cor_texto
            })));
        }
    }

    useEffect(() => {
        carregarQuadros();
    }, []);

    /* =========================
       SALVAMENTOS
    ========================= */

    async function salvarNome() {
        if (!nomeQuadro.trim()) return;

        const r = await fetch(`${API_URL}/paleta/nome`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nomeQuadro })
        });

        const j = await r.json();

        if (j.ok) {
            setQuadroId(j.quadro_id);
            setFormas([]);
            setFormaAtiva(null);
            setFase("quadros");
        } else {
            alert(j.erro);
        }
    }

    async function salvarFormas() {
        if (!quadroId) return;

        setSalvando(true);
        setStatusEnvio("Espere, salvando...");

        const formasLimpa = formas.map(f => ({
            x: f.x,
            y: f.y,
            w: f.w,
            h: f.h,
            cor: f.cor,
            texto: f.texto,
            tamanhoTexto: f.tamanhoTexto,
            corTexto: f.corTexto,
            id:
                typeof f.id === "number" &&
                    f.id > 0 &&
                    f.id < 1000000000
                    ? f.id
                    : null
        }));

        const r = await fetch(`${API_URL}/paleta/formas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quadro_id: quadroId,
                formas: formasLimpa
            })
        });

        const j = await r.json();

        if (j.ok) {
            setStatusEnvio("Atualizado!");
            carregarFormas(quadroId);
        } else {
            setStatusEnvio("Erro ao salvar");
        }

        setTimeout(() => {
            setSalvando(false);
            setStatusEnvio("");
        }, 1500);
    }



    /* =========================
       DESENHO
    ========================= */

    function desenhar() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // FUNDO
        ctx.fillStyle = fundoQuadro;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1️⃣ DESENHA TODAS AS FORMAS
        formas.forEach(f => {
            ctx.fillStyle = f.cor;
            ctx.fillRect(f.x, f.y, f.w, f.h);

            if (
                formaAtiva &&
                (
                    formaAtiva.tempId === f.tempId ||
                    (formaAtiva.id && formaAtiva.id === f.id)
                )
            ) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.strokeRect(f.x, f.y, f.w, f.h);
            }
        });

        // 2️⃣ DESENHA TODOS OS TEXTOS POR CIMA
        formas.forEach(f => {
            if (f.texto) {
                ctx.fillStyle = f.corTexto;
                ctx.font = `${f.tamanhoTexto}px Arial`;
                ctx.textBaseline = "top";
                ctx.fillText(f.texto, f.x + 6, f.y + 6);
            }
        });

        // PREVIEW
        if (preview) {
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 2;
            ctx.strokeRect(preview.x, preview.y, preview.w, preview.h);
        }
    }

    useEffect(() => {
        desenhar();
    }, [formas, preview, formaAtiva, fundoQuadro]);

    /* =========================
       COLISÃO
    ========================= */

    function colide(nova) {
        return formas.some(f =>
            nova.x < f.x + f.w &&
            nova.x + nova.w > f.x &&
            nova.y < f.y + f.h &&
            nova.y + nova.h > f.y
        );
    }

    /* =========================
       MOUSE
    ========================= */

    function mouseDown(e) {
        if (fase !== "quadros") return;

        const r = canvasRef.current.getBoundingClientRect();
        setInicio({
            x: e.clientX - r.left,
            y: e.clientY - r.top
        });
    }

    function mouseMove(e) {
        if (!inicio || fase !== "quadros") return;

        const r = canvasRef.current.getBoundingClientRect();
        setPreview({
            x: Math.min(inicio.x, e.clientX - r.left),
            y: Math.min(inicio.y, e.clientY - r.top),
            w: Math.abs(e.clientX - r.left - inicio.x),
            h: Math.abs(e.clientY - r.top - inicio.y)
        });
    }

    function mouseUp() {
        if (!preview || colide(preview)) {
            setPreview(null);
            setInicio(null);
            return;
        }

        setFormas(prev => [
            ...prev,
            {
                tempId: crypto.randomUUID(), // ID LOCAL
                x: preview.x,
                y: preview.y,
                w: preview.w,
                h: preview.h,
                cor: "#d4af37",
                texto: "",
                tamanhoTexto: 16,
                corTexto: "#000000"
            }
        ]);


        setPreview(null);
        setInicio(null);
    }

    /* =========================
       APAGAR
    ========================= */

    async function apagarForma() {
        if (!formaAtiva) return;

        // se a forma veio do banco, apaga no banco
        if (formaAtiva.id) {
            await fetch(`${API_URL}/paleta/forma/apagar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    forma_id: formaAtiva.id
                })
            });
        }

        // remove da tela
        setFormas(formas.filter(f => f !== formaAtiva));
        setFormaAtiva(null);
    }


    function voltarLista() {
        setFase(null);
        setQuadroId(null);
        setNomeQuadro("");
        setFormas([]);
        setFormaAtiva(null);
    }

    /* =========================
       UI
    ========================= */

    if (!fase) {
        return (
            <div className="paleta-container">
                <h3>Quadros</h3>

                {quadros.map(q => (
                    <div key={q.id} className="paleta-quadro-item">
                        <span>{q.nome}</span>
                        <button onClick={() => {
                            setQuadroId(q.id);
                            carregarFormas(q.id);
                            setFase("quadros");
                        }}>
                            Editar
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setFase("nome")}
                    style={{
                        marginTop: "16px",
                        padding: "12px 22px",
                        background: "linear-gradient(135deg, #d4af37, #b8962e)",
                        color: "#0e0e0e",
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease"
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.45)";
                        e.currentTarget.style.filter = "brightness(1.05)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.35)";
                        e.currentTarget.style.filter = "none";
                    }}
                >
                    Adicionar
                </button>

            </div>
        );
    }

    return (
        <div className="paleta-container">

            <button className="btn-voltar-paleta" onClick={voltarLista}>
                ⬅ Voltar
            </button>

            {fase === "nome" && (
                <div className="paleta-fase">
                    <input
                        value={nomeQuadro}
                        onChange={e => setNomeQuadro(e.target.value)}
                        placeholder="Nome do quadro"
                    />
                    <button onClick={salvarNome}>Salvar</button>
                </div>
            )}

            {fase !== "nome" && (
                <>
                    <div className="paleta-fases">
                        <button onClick={() => setFase("quadros")}>Quadros</button>
                        <button onClick={() => setFase("letras")}>Letras</button>
                        <button onClick={() => setFase("cores")}>Cores</button>
                        <button onClick={apagarForma}>Apagar forma</button>
                    </div>
                    <p className="status-envio">{statusEnvio}</p>

                    <button
                        className="btn-enviar-paleta"
                        onClick={salvarFormas}
                        disabled={salvando}
                    >
                        {salvando ? "Atualizando..." : "Atualizar"}
                    </button>


                </>
            )}

            {fase === "letras" && formaAtiva && (
                <div
                    className="painel-letras-flutuante"
                    style={{
                        top: canvasRef.current.getBoundingClientRect().top + 20 + window.scrollY,
                        left: canvasRef.current.getBoundingClientRect().right + 20 + window.scrollX
                    }}

                >
                    <label>Texto</label>
                    <input
                        value={formaAtiva.texto}
                        onChange={e => {
                            const n = { ...formaAtiva, texto: e.target.value };
                            setFormaAtiva(n);
                            setFormas(formas.map(f =>
                                f.tempId === n.tempId || (f.id && f.id === n.id)
                                    ? n
                                    : f
                            ));
                        }}
                    />

                    <label>Tamanho</label>
                    <input
                        type="number"
                        min="8"
                        max="72"
                        value={formaAtiva.tamanhoTexto}
                        onChange={e => {
                            const n = { ...formaAtiva, tamanhoTexto: Number(e.target.value) };
                            setFormaAtiva(n);
                            setFormas(formas.map(f =>
                                f.tempId === n.tempId || (f.id && f.id === n.id)
                                    ? n
                                    : f
                            ));
                        }}
                    />
                    <p className="status-envio">{statusEnvio}</p>

                    <button
                        className="btn-enviar-paleta"
                        onClick={salvarFormas}
                        disabled={salvando}
                    >
                        {salvando ? "Atualizando..." : "Atualizar"}
                    </button>

                </div>
            )}
            {fase === "cores" && (
                <div
                    className="painel-letras-flutuante"
                    style={{
                        top: canvasRef.current.getBoundingClientRect().top + 20 + window.scrollY,
                        left: canvasRef.current.getBoundingClientRect().right + 20 + window.scrollX
                    }}
                >
                    <label>Fundo do quadro</label>
                    <input
                        type="color"
                        value={fundoQuadro}
                        onChange={e => setFundoQuadro(e.target.value)}
                    />

                    {formaAtiva && (
                        <>
                            <label>Cor da forma</label>
                            <input
                                type="color"
                                value={formaAtiva.cor}
                                onChange={e => {
                                    const n = { ...formaAtiva, cor: e.target.value };
                                    setFormaAtiva(n);
                                    setFormas(formas.map(f =>
                                        f.tempId === n.tempId || (f.id && f.id === n.id)
                                            ? n
                                            : f
                                    ));
                                }}
                            />

                            <label>Cor do texto</label>
                            <input
                                type="color"
                                value={formaAtiva.corTexto}
                                onChange={e => {
                                    const n = { ...formaAtiva, corTexto: e.target.value };
                                    setFormaAtiva(n);
                                    setFormas(formas.map(f => f.id === n.id ? n : f));
                                }}
                            />
                        </>
                    )}
                    <p className="status-envio">{statusEnvio}</p>

                    <button
                        className="btn-enviar-paleta"
                        onClick={salvarFormas}
                        disabled={salvando}
                    >
                        {salvando ? "Atualizando..." : "Atualizar"}
                    </button>

                </div>
            )}


            <canvas
                ref={canvasRef}
                width={900}
                height={500}
                onMouseDown={mouseDown}
                onMouseMove={mouseMove}
                onMouseUp={mouseUp}
                onClick={e => {
                    const r = canvasRef.current.getBoundingClientRect();
                    const x = e.clientX - r.left;
                    const y = e.clientY - r.top;

                    const f = formas.find(f =>
                        x >= f.x &&
                        x <= f.x + f.w &&
                        y >= f.y &&
                        y <= f.y + f.h
                    );


                    setFormaAtiva(f || null);
                }}
            />
        </div>
    );
}
