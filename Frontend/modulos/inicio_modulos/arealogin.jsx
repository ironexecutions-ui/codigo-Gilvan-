import React, { useState, useRef } from "react";
import "./arealogin.css";
import { API_URL } from "../../config";

export default function AreaLogin() {

    const [modo, setModo] = useState("email");

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [codigo, setCodigo] = useState("");
    const [qrcode, setQrcode] = useState("");

    const [erro, setErro] = useState("");

    const codigoRef = useRef(null);
    const qrcodeRef = useRef(null);

    async function fazerLogin(url, body) {
        setErro("");

        const resp = await fetch(`${API_URL}${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const json = await resp.json();

        if (!resp.ok) {
            setErro(json.detail);
            return;
        }

        const token =
            json.token ||
            json.access_token ||
            json.jwt ||
            json.accessToken;

        if (!token) {
            setErro("Erro no login: token não recebido");
            return;
        }

        // só aqui substitui a sessão
        localStorage.setItem("token", token);

        const payload = JSON.parse(atob(token.split(".")[1]));
        localStorage.setItem("cliente", JSON.stringify(payload));

        window.location.href = "/ironbusiness/perfil";
    }

    function entrarEmail(e) {
        e.preventDefault();
        fazerLogin("/login/email", { email, senha });
    }

    function entrarCodigo(e) {
        e.preventDefault();
        if (!codigo.trim()) return;
        fazerLogin("/login/codigo", { codigo });
    }

    function entrarQrcode(e) {
        e.preventDefault();
        if (!qrcode.trim()) return;
        fazerLogin("/login/qrcode", { qrcode });
    }

    return (
        <div className="area-login-container">
            <h2>Entrar</h2>

            <div className="modo-botoes">
                <button onClick={() => setModo("email")}>Email e senha</button>
                <button onClick={() => setModo("codigo")}>Código de Barras</button>
                <button onClick={() => setModo("qrcode")}>QR Code</button>
            </div>

            {erro && <p className="erro">{erro}</p>}

            {modo === "email" && (
                <form onSubmit={entrarEmail} className="area-login-form">
                    <label>Email</label>
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <label>Senha</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                    />

                    <button type="submit">Entrar</button>
                </form>
            )}

            {modo === "codigo" && (
                <form onSubmit={entrarCodigo} className="area-login-form">
                    <div
                        className="barcode-box"
                        onClick={() => codigoRef.current.focus()}
                    >
                        <span>Clique e escaneie o código</span>
                        <input
                            ref={codigoRef}
                            value={codigo}
                            onChange={e => setCodigo(e.target.value)}
                            className="barcode-input"
                            autoFocus
                        />
                    </div>
                </form>
            )}

            {modo === "qrcode" && (
                <form onSubmit={entrarQrcode} className="area-login-form">
                    <div
                        className="qrcode-box"
                        onClick={() => qrcodeRef.current.focus()}
                    >
                        <div className="qrcode-desenho" />
                        <span>Clique e escaneie o QR Code</span>
                        <input
                            ref={qrcodeRef}
                            value={qrcode}
                            onChange={e => setQrcode(e.target.value)}
                            className="barcode-input"
                            autoFocus
                        />
                    </div>
                </form>
            )}
        </div>
    );
}
