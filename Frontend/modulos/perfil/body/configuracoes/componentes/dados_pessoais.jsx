import React, { useState, useEffect } from "react";
import { URL } from "../../url";
import "./dados_pessoais.css";

export default function DadosPessoais() {
    const [senhaAtual, setSenhaAtual] = useState("");
    const [senhaAtualOk, setSenhaAtualOk] = useState(null);

    const [senha, setSenha] = useState("");
    const [confirmar, setConfirmar] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [carregando, setCarregando] = useState(false);

    function validarSenha(valor) {
        if (valor.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
        if (!/[a-zA-Z]/.test(valor)) return "A senha deve conter pelo menos uma letra.";
        if (!/[0-9]/.test(valor)) return "A senha deve conter pelo menos um número.";
        return "";
    }

    // ===============================
    // VERIFICAR SENHA ATUAL
    // ===============================
    useEffect(() => {
        if (!senhaAtual || senhaAtual.length < 4) {
            setSenhaAtualOk(null);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem("token");

                const resp = await fetch(`${URL}/clientes/verificar-senha`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ senha: senhaAtual })
                });

                const json = await resp.json();
                setSenhaAtualOk(json.valida === true);
            } catch {
                setSenhaAtualOk(false);
            }
        }, 600);

        return () => clearTimeout(timeout);
    }, [senhaAtual]);

    // ===============================
    // SALVAR NOVA SENHA
    // ===============================
    async function salvarSenha() {
        setErro("");
        setSucesso("");

        if (!senhaAtualOk) {
            setErro("Senha atual incorreta.");
            return;
        }

        const erroValidacao = validarSenha(senha);
        if (erroValidacao) {
            setErro(erroValidacao);
            return;
        }

        if (senha !== confirmar) {
            setErro("As senhas não coincidem.");
            return;
        }

        try {
            setCarregando(true);
            const token = localStorage.getItem("token");

            const resp = await fetch(`${URL}/clientes/alterar-senha`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ senha })
            });

            const json = await resp.json();

            if (!resp.ok) {
                setErro(json.detail || "Erro ao alterar senha.");
                return;
            }

            setSenhaAtual("");
            setSenha("");
            setConfirmar("");
            setSenhaAtualOk(null);
            setSucesso("Senha alterada com sucesso.");
        } catch {
            setErro("Erro de conexão com o servidor.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="dp-container">

            <div className="dp-card">
                <div className="dp-field">
                    <label>Senha atual</label>
                    <input
                        type="password"
                        value={senhaAtual}
                        onChange={e => setSenhaAtual(e.target.value)}
                        placeholder="Digite sua senha atual"
                        className={
                            senhaAtualOk === null
                                ? ""
                                : senhaAtualOk
                                    ? "dp-input-ok"
                                    : "dp-input-error"
                        }
                    />

                    {senhaAtualOk === true && (
                        <span className="dp-hint-ok">Senha correta</span>
                    )}

                    {senhaAtualOk === false && (
                        <span className="dp-hint-error">Senha incorreta</span>
                    )}
                </div>

                <div className="dp-field">
                    <label>Nova senha</label>
                    <input
                        type="password"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        placeholder="Mínimo 8 caracteres, letras e números"
                    />
                </div>

                <div className="dp-field">
                    <label>Confirmar nova senha</label>
                    <input
                        type="password"
                        value={confirmar}
                        onChange={e => setConfirmar(e.target.value)}
                        placeholder="Repita a nova senha"
                    />
                </div>

                {erro && <div className="dp-alert dp-error">{erro}</div>}
                {sucesso && <div className="dp-alert dp-success">{sucesso}</div>}

                <button
                    className="dp-button"
                    onClick={salvarSenha}
                    disabled={carregando || !senhaAtualOk}
                >
                    {carregando ? "Salvando..." : "Alterar senha"}
                </button>
            </div>
        </div>
    );
}
