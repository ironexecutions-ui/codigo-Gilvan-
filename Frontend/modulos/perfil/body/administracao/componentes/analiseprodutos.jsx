import React, { useEffect, useState } from "react";

import LucroGeral from "./analises/lucrogeral";
import Code from "./analises/code";
import LucroPorMes from "./analises/lucropormes";
import Contabilidade from "./analises/contabilidade";
import Pontos from "./analises/pontos";
import Registro from "./analises/registro";

import { API_URL } from "../../../../../config";
import "./analiseprodutos.css";

export default function AnaliseProdutos() {

    const [aba, setAba] = useState("lucro-geral");
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_URL}/retorno/me`, {
            headers: {
                Authorization: "Bearer " + token
            }
        })
            .then(r => r.json())
            .then(res => {
                setUsuario(res);
            })
            .catch(() => {
                setUsuario(null);
            });
    }, []);

    const podeVerQuiz =
        usuario &&
        [11, 25, 27].includes(Number(usuario.comercio_id));

    return (
        <div className="analise-produtos-container">

            <div className="analise-botoes">

                <button
                    className={aba === "lucro-geral" ? "ativo" : ""}
                    onClick={() => setAba("lucro-geral")}
                >
                    % Lucro Geral
                </button>

                <button
                    className={aba === "ranking" ? "ativo" : ""}
                    onClick={() => setAba("ranking")}
                >
                    Código de Barras & QR Code
                </button>

                <button
                    style={{ display: "none" }}
                    className={aba === "lucro-mes" ? "ativo" : ""}
                    onClick={() => setAba("lucro-mes")}
                >
                    Lucro por Mês
                </button>

                {podeVerQuiz && (
                    <button
                        className={aba === "pontos" ? "ativo" : ""}
                        onClick={() => setAba("pontos")}
                    >
                        Pontos
                    </button>
                )}

                {podeVerQuiz && (
                    <button
                        className={aba === "registro" ? "ativo" : ""}
                        onClick={() => setAba("registro")}
                    >
                        Registro Quiz
                    </button>
                )}

                <button
                    className={aba === "sem-venda" ? "ativo" : ""}
                    onClick={() => setAba("sem-venda")}
                >
                    Contabilidade
                </button>

            </div>

            <div className="analise-conteudo">
                {aba === "lucro-geral" && <LucroGeral />}
                {aba === "ranking" && <Code />}
                {aba === "lucro-mes" && <LucroPorMes />}
                {aba === "sem-venda" && <Contabilidade />}
                {aba === "pontos" && podeVerQuiz && <Pontos />}
                {aba === "registro" && podeVerQuiz && <Registro />}
            </div>

        </div>
    );
}
