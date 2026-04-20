import React, { useState } from "react";
import Passo1Loja from "./cadastro_modulos/passoloja";
import Passo2Personalizar from "./cadastro_modulos/passopersonalizar";
import Passo3Modulos from "./cadastro_modulos/passomodulos";
import Passo4Cliente from "./cadastro_modulos/passocliente";
import { API_URL } from "../config";
import './cadastrocomercio.css'
export default function CadastroComercio() {

    const [passo, setPasso] = useState(1);

    const [dadosLoja, setDadosLoja] = useState({});
    const [dadosPersonalizar, setDadosPersonalizar] = useState({});
    const [dadosModulos, setDadosModulos] = useState([]);

    async function finalizarCadastro(clienteInfo) {

        const corpo = {
            loja: dadosLoja,
            personalizar: dadosPersonalizar,
            modulos: dadosModulos,
            cliente: clienteInfo
        };

        const resp = await fetch(`${API_URL}/cadastro/finalizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });

        const json = await resp.json();

        if (!resp.ok) {
            alert(json.detail || "Erro ao finalizar cadastro");
            return;
        }

        alert("Cadastro concluído com sucesso");
        window.location.href = "/";
    }

    return (
        <div className="cadastro-comercio-container">
            <h2>Cadastro do Comércio</h2>

            {passo === 1 && (
                <Passo1Loja
                    onContinuar={(info) => {
                        setDadosLoja(info);
                        setPasso(2);
                    }}
                />
            )}

            {passo === 2 && (
                <Passo2Personalizar
                    onContinuar={(info) => {
                        setDadosPersonalizar(info);
                        setPasso(3);
                    }}
                    onPular={() => {
                        setDadosPersonalizar({
                            fundo: "#ffffff",
                            letra_tipo: "Montserrat",
                            letra_cor: "#000000"
                        });
                        setPasso(3);
                    }}
                />
            )}

            {passo === 3 && (
                <Passo3Modulos
                    onContinuar={(info) => {
                        setDadosModulos(info);
                        setPasso(4);
                    }}
                />
            )}

            {passo === 4 && (
                <Passo4Cliente
                    onFinalizar={(info) => {
                        finalizarCadastro(info);
                    }}
                />
            )}
        </div>
    );
}
