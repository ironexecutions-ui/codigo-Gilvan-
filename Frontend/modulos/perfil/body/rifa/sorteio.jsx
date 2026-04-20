import React, { useState, useEffect } from "react";
import { API_URL } from "../../../../config";
import "./sorteio.css";

export default function SorteioRifa({ rifa, premio }) {

    const [tempo, setTempo] = useState("");
    const [numeroAnimado, setNumeroAnimado] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [erro, setErro] = useState(null);
    const [rodando, setRodando] = useState(false);
    const [verificandoResultado, setVerificandoResultado] = useState(true);
    const [liberadoParaSorteio, setLiberadoParaSorteio] = useState(false);
    const [comemorar, setComemorar] = useState(false);

    useEffect(() => {
        if (!rifa?.data_fim) return;

        const agora = new Date();
        const dataFim = new Date(rifa.data_fim);

        if (agora >= dataFim) {
            setLiberadoParaSorteio(true);
        } else {
            setLiberadoParaSorteio(false);
        }
    }, [rifa]);

    // ===============================
    // INTERVALO DA RIFA
    // ===============================
    const [inicioRifa, fimRifa] =
        rifa?.numeros && rifa.numeros.includes("-")
            ? rifa.numeros.split("-").map(Number)
            : [null, null];

    // ===============================
    // VERIFICAR SE JÁ FOI SORTEADA
    // ===============================
    useEffect(() => {
        if (!rifa?.id) return;

        setVerificandoResultado(true);

        fetch(`${API_URL}/rifa/${rifa.id}/resultado`)
            .then(r => r.json())
            .then(data => {
                if (data?.sorteado) {
                    setResultado(data);
                    setNumeroAnimado(data.numero);
                }
            })
            .catch(() => { })
            .finally(() => setVerificandoResultado(false));
    }, [rifa]);

    // ===============================
    // INICIAR SORTEIO (EFEITO VISUAL)
    // ===============================
    async function iniciarSorteio() {
        if (!tempo || tempo <= 0) return;
        if (inicioRifa == null || fimRifa == null) {
            setErro("Intervalo da rifa inválido.");
            return;
        }

        setRodando(true);
        setErro(null);
        setResultado(null);
        setNumeroAnimado(null);

        // 🔐 CHAMA O BACKEND IMEDIATAMENTE
        let resultadoBackend;

        try {
            const r = await fetch(`${API_URL}/rifa/${rifa.id}/sortear`, {
                method: "POST"
            });

            if (!r.ok) throw new Error(await r.text());
            resultadoBackend = await r.json();
        } catch (e) {
            setErro(e.message);
            setRodando(false);
            return;
        }

        const duracao = Number(tempo) * 1000;
        const inicioTempo = Date.now();

        const animacao = setInterval(() => {
            const fake =
                Math.floor(Math.random() * (fimRifa - inicioRifa + 1)) + inicioRifa;

            setNumeroAnimado(fake);

            if (Date.now() - inicioTempo >= duracao) {
                clearInterval(animacao);

                // ✅ FINALIZA SEMPRE COM O NÚMERO DO BACKEND
                setNumeroAnimado(resultadoBackend.numero);
                setResultado(resultadoBackend);
                setRodando(false);
                setComemorar(true);

                // encerra a comemoração depois de 4 segundos
                setTimeout(() => setComemorar(false), 4000);
            }
        }, 80);
    }


    // ===============================
    // FINALIZAR (BACKEND DEFINE)
    // ===============================
    async function finalizar() {
        try {
            const r = await fetch(`${API_URL}/rifa/${rifa.id}/sortear`, {
                method: "POST"
            });

            if (!r.ok) throw new Error(await r.text());

            const data = await r.json();
            setNumeroAnimado(data.numero);
            setResultado(data);
        } catch (e) {
            setErro(e.message);
        } finally {
            setRodando(false);
        }
    }

    // ===============================
    // BLOQUEIO ENQUANTO VERIFICA
    // ===============================
    if (verificandoResultado) {
        return (
            <div className="sorteioRifa-container">
                <p className="sorteioRifa-alertaDefinitivo">
                    Verificando status do sorteio...
                </p>
            </div>
        );
    }
    if (!liberadoParaSorteio) {
        return (
            <div className="sorteioRifa-container">
                <p className="sorteioRifa-alertaDefinitivo">
                    O sorteio ficará disponível após a data de encerramento da rifa.
                </p>
            </div>
        );
    }

    return (
        <div className="sorteioRifa-container">

            {/* ===== ETAPA INICIAL + SORTEANDO ===== */}
            {!resultado && (
                <div className="sorteioRifa-etapaInicial">

                    <p className="sorteioRifa-alertaDefinitivo">
                        Atenção: após a finalização do sorteio, o resultado será
                        registrado de forma definitiva e não poderá ser alterado.
                    </p>

                    <div className="sorteioRifa-controleTempo">
                        <input
                            type="number"
                            className="sorteioRifa-inputTempo"
                            placeholder="Tempo do sorteio (segundos)"
                            value={tempo}
                            onChange={e => setTempo(e.target.value)}
                            disabled={rodando}
                        />

                        <button
                            className={`sorteioRifa-botaoIniciar ${rodando ? "sorteioRifa-botaoInativo" : ""}`}
                            onClick={iniciarSorteio}
                            disabled={rodando}
                        >
                            {rodando ? "Sorteando..." : "Iniciar sorteio"}
                        </button>
                    </div>

                    {numeroAnimado !== null && (
                        <div className="sorteioRifa-animacaoNumero">

                            {rodando && (
                                <div className="sorteioRifa-emojis">
                                    {Array.from({ length: 18 }).map((_, i) => {
                                        const emojis = ["🎉", "🎊", "✨", "🔥", "💫", "⭐", "💥", "🍀", "🏆", "🎯"];
                                        return (
                                            <span
                                                key={i}
                                                className="sorteioRifa-emoji"
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    animationDelay: `${Math.random() * 2}s`,
                                                    fontSize: `${16 + Math.random() * 26}px`
                                                }}
                                            >
                                                {emojis[Math.floor(Math.random() * emojis.length)]}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <span
                                className={`sorteioRifa-numeroAtual ${rodando
                                    ? "sorteioRifa-numeroRodando"
                                    : resultado
                                        ? "sorteioRifa-numeroFinal"
                                        : ""
                                    }`}
                            >
                                {numeroAnimado}
                            </span>

                        </div>
                    )}

                </div>
            )}

            {/* ===== RESULTADO FINAL ===== */}
            {resultado && (
                <div className="sorteioRifa-resultadoFinal">

                    <h2 className="sorteioRifa-numeroSorteado">
                        Número sorteado: <span>{resultado.numero}</span>
                    </h2>

                    {resultado.sem_ganhador ? (
                        <div className="sorteioRifa-blocoSemGanhador">
                            <p className="sorteioRifa-textoSemGanhador">
                                O sorteio foi realizado corretamente conforme as regras da rifa.
                                No entanto, nenhum participante adquiriu o número sorteado.
                            </p>
                        </div>
                    ) : (
                        <div className="sorteioRifa-blocoGanhador">

                            <h3 className="sorteioRifa-nomeGanhador">
                                O ganhador do premio {premio}  é para:   {resultado.nome}
                            </h3>

                            <div className="sorteioRifa-acoesContato">

                                <a
                                    className="sorteioRifa-linkWhatsapp"
                                    href={`https://wa.me/55${resultado.whatsapp}?text=${encodeURIComponent(
                                        `Parabéns ${resultado.nome}!

Você foi o ganhador do prêmio "${premio}".`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Entrar em contato pelo WhatsApp
                                </a>

                                <button
                                    className="sorteioRifa-botaoCopiarEmail"
                                    onClick={() => {
                                        const msg = `Parabéns ${resultado.nome}!

Você foi o ganhador do prêmio "${premio}".`;
                                        navigator.clipboard.writeText(`${resultado.email}\n\n${msg}`);
                                        alert("Email e mensagem copiados");
                                    }}
                                >
                                    Copiar email do ganhador
                                </button>

                            </div>

                        </div>
                    )}

                </div>
            )}

            {erro && (
                <p className="sorteioRifa-mensagemErro">
                    {erro}
                </p>
            )}
            {comemorar && (
                <div className="sorteioRifa-comemoracao">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <span
                            key={i}
                            className="sorteioRifa-fogo"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random()}s`,
                                fontSize: `${18 + Math.random() * 30}px`
                            }}
                        >
                            🎆
                        </span>
                    ))}
                </div>
            )}

        </div>
    );
}
