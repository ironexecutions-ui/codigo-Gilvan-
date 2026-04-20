import React, { useEffect, useState } from "react";
import { URL } from "../../../url";
import "./blocopix.css";

export default function BlocoPix({ token }) {

    const [publicKey, setPublicKey] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [gerarPix, setGerarPix] = useState(null);
    const [salvando, setSalvando] = useState(false);
    function atualizarMercado(valor) {
        setGerarPix(valor);

        fetch(`${URL}/comercio/pix/salvar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                gerar_pix: valor ? 1 : 0,
                public_key: null,
                access_token: null
            })
        });
    }

    useEffect(() => {
        fetch(`${URL}/comercio/pix/ativo`, {
            headers: {
                Authorization: "Bearer " + token
            }
        })
            .then(r => r.json())
            .then(json => {
                if (json.ativo) {
                    setGerarPix(true);
                    setPublicKey(json.public_key || "");
                } else {
                    setGerarPix(false);
                }
            });
    }, [token]);

    function salvar() {
        if (gerarPix === null) {
            alert("Selecione se deseja gerar QR Code Pix");
            return;
        }

        setSalvando(true);

        fetch(`${URL}/comercio/pix/salvar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                gerar_pix: gerarPix ? 1 : 0,
                public_key: gerarPix ? publicKey : null,
                access_token: gerarPix ? accessToken : null
            })
        })
            .then(r => r.json())
            .then(() => alert("Configuração Pix salva com sucesso"))
            .finally(() => setSalvando(false));
    }

    return (
        <section className="dc-section">
            <h2 className="dc-title">Pix Mercado Pago</h2>

            <div className="dc-pix-box">

                <p className="dc-pix-question">
                    Gerar QR Code Pix na tela?
                </p>

                <div className="dc-pix-opcoes">
                    <label>
                        <input
                            type="radio"
                            checked={gerarPix === true}
                            onChange={() => atualizarMercado(true)}
                        />

                        Sim
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={gerarPix === false}
                            onChange={() => atualizarMercado(false)}
                        />

                        Não
                    </label>
                </div>

                <input
                    className="dc-pix-input"
                    placeholder="Public Key"
                    value={publicKey}
                    onChange={e => setPublicKey(e.target.value)}
                    disabled={!gerarPix}
                />

                <input
                    className="dc-pix-input secreto"
                    placeholder="Access Token"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    disabled={!gerarPix}
                />

                <button
                    className="dc-pix-btn"
                    onClick={salvar}
                    disabled={salvando || gerarPix === false}
                >

                    {salvando ? "Salvando..." : "Salvar Pix"}
                </button>

                <p className="dc-pix-info">
                    As credenciais do Mercado Pago são armazenadas de forma criptografada
                    e utilizadas apenas para geração de pagamentos Pix no caixa.
                </p>
            </div>
        </section>
    );
}
