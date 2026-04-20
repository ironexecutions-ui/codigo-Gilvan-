import React, { useState, useEffect } from "react";
import "./passomodulos.css";
import { API_URL } from "../../config";

export default function Passo3Modulos({ onContinuar }) {

    const [listaModulos, setListaModulos] = useState([]);
    const [selecionados, setSelecionados] = useState([]);

    // Carregar módulos do backend
    useEffect(() => {
        async function carregar() {
            try {
                const resp = await fetch(`${API_URL}/modulos/ativoss`);
                const dados = await resp.json();
                setListaModulos(dados);
            } catch (err) {
                console.log("Erro ao buscar módulos:", err);
            }
        }
        carregar();
    }, []);

    function alternarSelecao(id) {
        if (selecionados.includes(id)) {
            setSelecionados(selecionados.filter(x => x !== id));
        } else {
            setSelecionados([...selecionados, id]);
        }
    }

    function confirmar() {
        const modulosFinal = listaModulos.filter(m => selecionados.includes(m.id));
        onContinuar(modulosFinal);
    }

    return (
        <div className="passo3-container">
            <h3 className="titulo">Escolha os módulos do sistema</h3>

            <div className="grid-modulos">
                {listaModulos.map(modulo => {
                    const ativo = selecionados.includes(modulo.id);
                    return (
                        <div
                            key={modulo.id}
                            onClick={() => alternarSelecao(modulo.id)}
                            className={`card-modulo ${ativo ? "ativo" : ""}`}
                        >
                            <h4 className="nome-modulo">{modulo.nome}</h4>

                            {modulo.preco && (
                                <p className="preco-modulo">
                                    R$ {Number(modulo.preco).toFixed(2)}
                                </p>
                            )}

                            <p className="texto-modulo">{modulo.texto}</p>
                        </div>
                    );
                })}
            </div>

            <button onClick={confirmar} className="botao-confirmar">
                Continuar
            </button>
        </div>
    );
}
