import React, { useState, useEffect } from "react";
import Cadastro from "./componentes/cadastro";
import Aulas from "./componentes/aulas";
import Alunos from "./componentes/aluno";

import "./matricula.css";

export default function Matricula() {

    const [aba, setAba] = useState(3);

    // 🔒 CONTROLE DE ACESSO
    const [autorizado, setAutorizado] = useState(false);
    const [senhaDigitada, setSenhaDigitada] = useState("");
    const [erro, setErro] = useState("");

    // 🔐 SENHA
    const senhaCorreta = import.meta.env.VITE_SENHA_ADMIN;

    // 🔍 VERIFICA SE ESTÁ EM LOCALHOST
    useEffect(() => {
        const host = window.location.hostname;

        if (host === "localhost" || host === "127.0.0.1") {
            setAutorizado(true);
        }
    }, []);

    function verificarSenha() {
        if (senhaDigitada === senhaCorreta) {
            setAutorizado(true);
            setErro("");
        } else {
            setErro("Senha incorreta");
        }
    }

    // 🔒 BLOQUEIO
    if (!autorizado) {
        return (
            <div className="matricula_loginContainer">

                <div className="matricula_loginBox">

                    <h2>Acesso restrito</h2>
                    <p>Digite a senha para acessar o painel de gestão</p>

                    <input
                        type="password"
                        placeholder="Digite a senha"
                        value={senhaDigitada}
                        onChange={(e) => setSenhaDigitada(e.target.value)}
                        className="matricula_input"
                    />

                    {erro && <span className="matricula_erro">{erro}</span>}

                    <button onClick={verificarSenha} className="matricula_button">
                        Entrar
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="matricula_container">

            <div className="matricula_header">
                <h1>Gestão de Alunos</h1>
                <p>Controle completo de matrículas, aulas e alunos</p>
            </div>

            <div className="matricula_tabs">
                <button className={aba === 1 ? "ativo" : ""} onClick={() => setAba(1)}>
                    Cadastro
                </button>

                <button className={aba === 2 ? "ativo" : ""} onClick={() => setAba(2)}>
                    Aulas
                </button>

                <button className={aba === 3 ? "ativo" : ""} onClick={() => setAba(3)}>
                    Alunos
                </button>
            </div>

            <div className="matricula_conteudo">
                {aba === 1 && <Cadastro />}
                {aba === 2 && <Aulas />}
                {aba === 3 && <Alunos />}
            </div>

        </div>
    );
}