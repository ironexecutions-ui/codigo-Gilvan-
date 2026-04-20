import React, { useEffect, useState } from "react";
import { useVenda } from "./vendaprovider";
import { API_URL } from "../../../../../config";
import "./listaitens.css";

export default function ListaItens() {

    const {
        itens,
        aumentarQuantidade,
        diminuirQuantidade,
        removerItem
    } = useVenda();

    const [tema, setTema] = useState("escuro");

    /* ===============================
       DEFINIR TEMA LOCAL
    =============================== */
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
            } catch {
                modoCliente = null;
            }

            if (modoCliente === 1) {
                setTema("escuro");
                return;
            }

            if (modoCliente === 2) {
                setTema("claro");
                return;
            }

            const hora = new Date().getHours();

            if (hora >= 18 || hora < 6) {
                setTema("escuro");
            } else {
                setTema("claro");
            }
        }

        definirTema();
    }, []);

    if (itens.length === 0) {
        return (
            <div className={`lista-itens-box tema-${tema}`}>
                <p className="lista-vazio">Nenhum item adicionado</p>
            </div>
        );
    }

    return (
        <div className={`lista-itens-box tema-${tema}`}>

            <div className="lista-itens-conteudo">
                {[...itens].reverse().map((item, index) => (
                    <div
                        key={item.id}
                        className="item-linha"
                        style={{ animationDelay: `${index * 40}ms` }}
                    >


                        <span className="item-nome">
                            {item.nome}
                            {item.unidade && (
                                <span className="item-und"> ({item.unidade})</span>
                            )}
                        </span>

                        <div className="item-controles">
                            <button
                                className="btn-menos"
                                onClick={() => diminuirQuantidade(item.id)}
                            >
                                −
                            </button>

                            <span className="item-qtd">{item.quantidade}</span>

                            <button
                                className="btn-mais"
                                onClick={() => aumentarQuantidade(item.id)}
                            >
                                +
                            </button>

                            <button
                                className="btn-remover"
                                onClick={() => removerItem(item.id)}
                            >
                                x
                            </button>
                        </div>

                        <strong className="item-preco">
                            R$ {item.subtotal.toFixed(2)}
                        </strong>

                    </div>
                ))}
            </div>

        </div>
    );
}
