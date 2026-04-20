import React, { useState } from "react";
import { API_URL } from "../../../../../../config";
import "./pontos.css";

export default function Pontos() {
    const [codigos, setCodigos] = useState([
        { codigo: "", pontos: 0 }
    ]);

    const [pontosUsar, setPontosUsar] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState("");

    function atualizarCodigo(index, valor) {
        const novo = [...codigos];
        novo[index].codigo = valor.toUpperCase();
        novo[index].pontos = 0;
        setCodigos(novo);
    }

    function adicionarCodigo() {
        setCodigos([...codigos, { codigo: "", pontos: 0 }]);
    }

    async function buscarPontos() {
        setMensagem("");
        setCarregando(true);

        try {
            const novo = [...codigos];

            for (let i = 0; i < novo.length; i++) {
                const c = novo[i].codigo;

                if (!c || c.length !== 4) {
                    throw new Error("Todos os códigos devem ter 4 caracteres.");
                }

                const res = await fetch(`${API_URL}/jogos/pontos/${c}`);
                if (!res.ok) {
                    throw new Error(`Código ${c} não encontrado.`);
                }

                const data = await res.json();
                novo[i].pontos = data.pontos;
            }

            setCodigos(novo);
        } catch (err) {
            setMensagem(err.message);
        } finally {
            setCarregando(false);
        }
    }

    const totalPontos = codigos.reduce((s, c) => s + c.pontos, 0);

    async function unificarPontos() {
        setMensagem("");
        setCarregando(true);

        try {
            const principal = codigos[0].codigo;
            const lista = codigos.map(c => c.codigo);

            const res = await fetch(`${API_URL}/jogos/unificar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    principal,
                    codigos: lista
                })
            });

            if (!res.ok) {
                throw new Error("Erro ao unificar pontos.");
            }

            const data = await res.json();

            setCodigos([
                { codigo: principal, pontos: data.pontos_total }
            ]);

            setMensagem("Pontos unificados com sucesso.");
        } catch (err) {
            setMensagem(err.message);
        } finally {
            setCarregando(false);
        }
    }

    async function entregarPremio() {
        setMensagem("");

        const valor = Number(pontosUsar);

        if (!valor || valor <= 0) {
            setMensagem("Informe um valor válido.");
            return;
        }

        if (valor > totalPontos) {
            setMensagem("Valor maior que os pontos disponíveis.");
            return;
        }

        setCarregando(true);

        try {
            const res = await fetch(`${API_URL}/jogos/entregar-premio`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codigo: codigos[0].codigo,
                    pontos_usados: valor
                })
            });

            if (!res.ok) {
                throw new Error("Erro ao entregar prêmio.");
            }

            const data = await res.json();

            setCodigos([
                { codigo: codigos[0].codigo, pontos: data.pontos_restantes }
            ]);

            setPontosUsar("");
            setMensagem("Prêmio entregue com sucesso.");
        } catch (err) {
            setMensagem(err.message);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="pontos-container">
            <h1 className="pontos-title">Pontos</h1>

            {codigos.map((c, i) => (
                <input
                    key={i}
                    type="text"
                    maxLength={4}
                    value={c.codigo}
                    onChange={(e) => atualizarCodigo(i, e.target.value)}
                    placeholder={`Código ${i + 1}`}
                    className="pontos-input-codigo"
                />
            ))}

            <button
                onClick={adicionarCodigo}
                className="pontos-btn-buscar"
                disabled={carregando}
            >
                +
            </button>

            <button
                onClick={buscarPontos}
                className="pontos-btn-buscar"
                disabled={carregando}
            >
                Buscar pontos
            </button>

            <p className="pontos-total">
                Total de pontos: <strong>{totalPontos}</strong>
            </p>

            {codigos.length > 1 && (
                <button
                    onClick={unificarPontos}
                    className="pontos-btn-entregar"
                    disabled={carregando}
                >
                    Unificar
                </button>
            )}

            <input
                type="number"
                value={pontosUsar}
                onChange={(e) => setPontosUsar(e.target.value)}
                placeholder="Pontos para prêmio"
                className="pontos-input-usar"
            />

            <button
                onClick={entregarPremio}
                className="pontos-btn-entregar"
                disabled={carregando}
            >
                Entregar prêmio
            </button>

            {mensagem && <p className="pontos-mensagem">{mensagem}</p>}
        </div>
    );
}
