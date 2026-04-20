import React, { useEffect, useState } from "react";
import "./lojasavaliacao.css";
import { API_URL } from "../../config";

export default function LojasAvaliacao() {

    const [lojas, setLojas] = useState([]);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregar() {
            try {
                const resp = await fetch(`${API_URL}/cadastrados/comercios_cadastradas`);
                const dados = await resp.json();
                setLojas(dados);
            } catch (err) {
                setErro("Não foi possível carregar as lojas.");
            }
        }

        carregar();
    }, []);

    function renderEstrelas(nota) {
        if (nota === null || nota === undefined) {
            return <span className="sem-avaliacao">sem avaliação</span>;
        }

        const estrelasCheias = Math.floor(nota);
        const meiaEstrela = nota % 1 >= 0.5;
        const estrelasVazias = 5 - estrelasCheias - (meiaEstrela ? 1 : 0);

        const icones = [];

        for (let i = 0; i < estrelasCheias; i++) {
            icones.push(<span key={"c" + i} className="estrela cheia">★</span>);
        }

        if (meiaEstrela) {
            icones.push(<span key="meia" className="estrela meia">★</span>);
        }

        for (let i = 0; i < estrelasVazias; i++) {
            icones.push(<span key={"v" + i} className="estrela vazia">★</span>);
        }

        return <span className="avaliacao-estrelas">{icones}</span>;
    }

    return (
        <div className="lojas-container">
            <h2>Comercios que usam nosso sistema</h2>

            {erro && <p style={{ color: "red" }}>{erro}</p>}

            <ul className="lojas-lista lojas-scroll">
                {lojas.length > 0 ? (
                    lojas.map((loja, index) => (
                        <li key={index} className="loja-item">
                            <img
                                src={loja.imagem}
                                alt={loja.loja}
                                className="loja-foto"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/60"; }}
                            />


                            <div className="loja-info">
                                {loja.loja}
                            </div>
                        </li>

                    ))
                ) : (
                    <p style={{ textAlign: "center", color: "#333" }}>
                        Carregando lojas...
                    </p>
                )}
            </ul>
        </div>
    );
}
