import React, { useState } from "react";
import "./passocliente.css";

export default function Passo4Cliente({ onFinalizar }) {

    const [email, setEmail] = useState("");
    const [nomeCompleto, setNomeCompleto] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [cargo, setCargo] = useState("");
    const [funcao] = useState("Administrador(a)");
    const [matricula, setMatricula] = useState("");

    const [erro, setErro] = useState("");

    function formatarNomeCompleto(valor) {
        return valor.replace(/\b\w+/g, palavra => {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        });
    }

    function mensagemSenha() {
        if (!confirmarSenha) {
            return "As senhas devem ser iguais";
        }
        if (senha !== confirmarSenha) {
            return "As senhas não coincidem";
        }
        return "As senhas coincidem";
    }

    function statusSenha() {
        if (!confirmarSenha) return "aviso";
        if (senha !== confirmarSenha) return "erro";
        return "ok";
    }

    async function enviar(e) {
        e.preventDefault();
        setErro("");

        if (!email.trim()) {
            setErro("Digite o email");
            return;
        }

        if (!nomeCompleto.trim()) {
            setErro("Digite o nome completo");
            return;
        }

        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (senha !== confirmarSenha) {
            setErro("As senhas não coincidem");
            return;
        }

        onFinalizar({
            email,
            nome_completo: nomeCompleto,
            senha,
            cargo,
            funcao,
            matricula: matricula || null
        });
    }

    return (
        <div className="passo4-container">
            <h3 className="titulo">Informações do responsável pelo comércio</h3>

            <form onSubmit={enviar} className="formulario">

                {erro && <div className="erro-box">{erro}</div>}

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-texto"
                />

                <label>Nome completo</label>
                <input
                    type="text"
                    value={nomeCompleto}
                    onChange={e => setNomeCompleto(formatarNomeCompleto(e.target.value))}
                    placeholder="Digite seu nome completo"
                    className="input-texto"
                />


                <label>Senha</label>
                <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="input-texto"
                />

                <label>Confirmar senha</label>
                <input
                    type="password"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    className={`input-texto ${statusSenha()}`}
                />

                <div className={`senha-status ${statusSenha()}`}>
                    {mensagemSenha()}
                </div>

                <label>Função</label>
                <input
                    type="text"
                    value={funcao}
                    disabled
                    className="input-texto"
                />

                <label>Cargo</label>
                <input
                    type="text"
                    list="cargos"
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    className="input-texto"
                />
                <datalist id="cargos">
                    <option value="Gerente" />
                    <option value="Gerente Geral" />
                    <option value="Administrador" />
                    <option value="Administrador Financeiro" />
                    <option value="Diretor" />
                    <option value="Diretor Administrativo" />
                    <option value="Sócio Administrador" />
                    <option value="Responsável Legal" />
                    <option value="Gestor de Operações" />
                    <option value="Gestor Comercial" />
                    <option value="Coordenador Administrativo" />
                    <option value="Supervisor Geral" />
                </datalist>

                <label>Matrícula do comércio (opcional)</label>
                <input
                    type="text"
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                    className="input-texto"
                />

                <button type="submit" className="botao-enviar">
                    Finalizar cadastro
                </button>

            </form>
        </div>
    );
}
