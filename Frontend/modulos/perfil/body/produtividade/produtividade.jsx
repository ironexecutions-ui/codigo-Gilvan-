import React, { useEffect, useState } from "react";

import BuscarProduto from "./componentes/buscarproduto";
import ProdutoAtual from "./componentes/produtoatual";
import ListaItens from "./componentes/listaitens";
import TotalVenda from "./componentes/totalvenda";
import Infos from "./componentes/infos";

import { VendaProvider, useVenda } from "./componentes/vendaprovider";
import { buscarInputRef } from "./componentes/buscarproduto";

import "./produtividade.css";

/* ===============================
   CONTEÚDO COM CONTEXTO
=============================== */
function ProdutividadeConteudo() {
    const { emPagamento, setEmPagamento, total } = useVenda();

    const {
        itens,
        aumentarQuantidade,
        diminuirQuantidade,
        modalAberto
    } = useVenda();

    /* ===============================
       TECLADO GLOBAL
    =============================== */
    useEffect(() => {

        function handleKeyDown(e) {

            // 🔒 modal bloqueia tudo
            // 🔒 SE MODAL ESTIVER ABERTO, NÃO FAZ NADA
            if (modalAberto) return;

            const input = buscarInputRef.current;
            if (!input) return;

            const ativo = document.activeElement;
            const ehCampo =
                ativo &&
                (ativo.tagName === "INPUT" || ativo.tagName === "TEXTAREA");

            if (!ehCampo && ativo !== input) {
                input.focus();
            }


            // ENTER = cobrar
            if (e.key === "Enter") {

                const input = buscarInputRef.current;
                if (!input) return;

                // 🚫 ENTER sozinho nunca cobra
                if (!e.ctrlKey) {
                    return;
                }

                // ⌨️ CTRL + ENTER
                // só cobra se input estiver vazio
                if (input.value.trim() !== "") {
                    return;
                }

                e.preventDefault();

                const btnCobrar = document.querySelector(".cob-botao");

                if (
                    btnCobrar &&
                    !btnCobrar.disabled &&
                    itens.length > 0
                ) {
                    btnCobrar.click();
                }
            }


            // + aumenta quantidade
            if (e.key === "+") {
                e.preventDefault();
                if (itens.length > 0) {
                    const ultimo = itens[itens.length - 1];
                    aumentarQuantidade(ultimo.id);
                }
            }

            // - diminui quantidade
            if (e.key === "-") {
                e.preventDefault();
                if (itens.length > 0) {
                    const ultimo = itens[itens.length - 1];
                    diminuirQuantidade(ultimo.id);
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);

    }, [itens, modalAberto]);

    return (
        <div className="prod-container tema-escuro">

            <div className="linha-superior">

                <div
                    style={{ background: "#102038", border: "2px solid #d4af37", maxHeight: "100%" }}
                    className="prod-card buscar buscar-wrapper"
                >
                    <BuscarProduto />
                    <Infos />
                </div>

                <div className="prod-card itens">
                    <ListaItens />
                </div>

            </div>

            <div className="linha-inferior">
                <div className="prod-card atual">
                    <ProdutoAtual />
                </div>

                <div
                    style={{ padding: "0", background: "transparent", border: "none" }}
                    className="prod-card total"
                >
                    <TotalVenda />
                </div>
            </div>

        </div>
    );
}

/* ===============================
   COMPONENTE PRINCIPAL
=============================== */
export default function Produtividade() {

    const [bloqueado, setBloqueado] = useState(false);

    /* ===============================
       BLOQUEAR CELULARES
    =============================== */
    useEffect(() => {
        function verificarDispositivo() {
            setBloqueado(window.innerWidth < 624);
        }

        verificarDispositivo();
        window.addEventListener("resize", verificarDispositivo);

        return () => {
            window.removeEventListener("resize", verificarDispositivo);
        };
    }, []);

    if (bloqueado) {
        return (
            <div className="bloqueio-mobile">
                <h1>Acesso não autorizado</h1>
                <p>Este sistema não pode ser utilizado em celulares ou telas pequenas.</p>
                <p>Utilize um computador ou notebook para continuar.</p>
            </div>
        );
    }

    return (
        <VendaProvider>
            <ProdutividadeConteudo />
        </VendaProvider>
    );
}
