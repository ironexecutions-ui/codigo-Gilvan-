import React, { useEffect, useState } from "react";
import { useVenda } from "./vendaprovider";
import { API_URL } from "../../../../../config";
import ModalPagamento from "./modalpagamento";
import "./totalvenda.css";

export default function TotalVenda() {

    const { total, itens, limparVenda, setLimparBusca } = useVenda();

    const [tema, setTema] = useState("escuro");
    const [abrirPagamento, setAbrirPagamento] = useState(false);

    const [mostrarUSD, setMostrarUSD] = useState(false);

    // 🔹 NOVOS ESTADOS
    const [converte, setConverte] = useState(0);
    const [cambio, setCambio] = useState(null);

    const vendaVazia = itens.length === 0;

    // ===============================
    // DEFINIR TEMA
    // ===============================
    useEffect(() => {
        async function definirTema() {
            let modoCliente = null;

            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const resp = await fetch(
                        `${API_URL}/api/clientes/modo`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (resp.ok) {
                        const data = await resp.json();
                        modoCliente = data.modo;
                    }
                }
            } catch { }

            if (modoCliente === 1) return setTema("escuro");
            if (modoCliente === 2) return setTema("claro");

            const hora = new Date().getHours();
            setTema(hora >= 18 || hora < 6 ? "escuro" : "claro");
        }

        definirTema();
    }, []);

    // ===============================
    // BUSCAR CONFIG DE CAMBIO DO BANCO
    // ===============================
    useEffect(() => {
        async function buscarCambio() {
            try {
                const token = localStorage.getItem("token");

                console.log("TOKEN:", token);

                const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : {};

                const resp = await fetch(`${API_URL}/comercio/cambio`, { headers });


                console.log("STATUS CAMBIO:", resp.status);

                if (!resp.ok) return;

                const data = await resp.json();

                console.log("DADOS CAMBIO:", data);

                setConverte(Number(data.converte));
                setCambio(Number(data.cambio));

            } catch (e) {
                console.log("ERRO CAMBIO:", e);
                setConverte(0);
                setCambio(null);
            }
        }

        buscarCambio();
    }, []);

    // ===============================
    // ESC = CANCELAR
    // ===============================
    useEffect(() => {
        function escCancelar(e) {
            if (e.key === "Escape" && !vendaVazia) {
                limparVenda();
            }
        }

        window.addEventListener("keydown", escCancelar);
        return () => window.removeEventListener("keydown", escCancelar);
    }, [vendaVazia, limparVenda]);

    // ===============================
    // VALOR FORMATADO
    // ===============================
    function valorExibido() {
        if (mostrarUSD && converte === 1 && cambio && total > 0) {
            const convertido = total / cambio;
            return `US$ ${convertido.toFixed(2)}`;
        }

        return `R$ ${total.toFixed(2)}`;
    }

    return (
        <div className={`cob-box cob-tema-${tema}`}>

            <div
                className={`cob-valor ${total > 0 && converte === 1 ? "clicavel" : ""}`}
                onClick={() => {
                    if (total > 0 && converte === 1 && cambio) {
                        setMostrarUSD(v => !v);
                    }
                }}
                title={
                    total > 0 && converte === 1
                        ? "Clique para alternar moeda"
                        : ""
                }
            >
                {valorExibido()}
            </div>

            <div className="cob-acoes">

                <button
                    className={`cob-botao-cancelar ${vendaVazia ? "desabilitado" : ""}`}
                    disabled={vendaVazia}
                    onClick={limparVenda}
                >
                    Cancelar
                </button>

                <button
                    className={`cob-botao ${vendaVazia ? "cob-botao-desabilitado" : ""}`}
                    disabled={vendaVazia}
                    onClick={() => {
                        setLimparBusca(true);
                        setAbrirPagamento(true);
                    }}
                >
                    Cobrar
                </button>

            </div>

            {abrirPagamento && (
                <ModalPagamento
                    total={total}
                    fechar={() => setAbrirPagamento(false)}
                />
            )}

        </div>
    );
}