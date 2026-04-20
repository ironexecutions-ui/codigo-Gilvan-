import React, { useState } from "react";
import { API_URL } from "../../config";
import "./perfil.css";

export default function Perfil() {

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [aluno, setAluno] = useState(null);
    const [novaSenha, setNovaSenha] = useState("");

    // 🔥 NOVOS STATES
    const [aulas, setAulas] = useState([]);
    const [mostrarAulas, setMostrarAulas] = useState(false);
    const [ultimaAula, setUltimaAula] = useState(null);

    async function entrar() {
        try {
            const r = await fetch(`${API_URL}/aulas/matricula/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            if (!r.ok) {
                const erro = await r.json();
                alert(erro.detail || "Erro ao entrar");
                return;
            }

            const data = await r.json();
            setAluno(data);

            // 🔥 BUSCAR ÚLTIMA AULA
            const resumo = await fetch(`${API_URL}/aulas/resumo`);
            const lista = await resumo.json();

            const meu = lista.find(a => a.id === data.id);

            if (meu) {
                setUltimaAula(meu.ultima_aula);
            }

        } catch (err) {
            alert("Erro de conexão");
        }
    }

    async function atualizarSenha() {

        const payload = {
            ...aluno,
            senha: novaSenha,
            idade: Number(aluno.idade)
        };

        const r = await fetch(`${API_URL}/aulas/matricula/${aluno.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (r.ok) {
            alert("Senha atualizada");
            setNovaSenha("");
        } else {
            alert("Erro ao atualizar");
        }
    }

    // 🔥 CARREGAR TODAS AS AULAS
    async function carregarAulas() {

        const r = await fetch(`${API_URL}/aulas/aulas/${aluno.id}`);
        const data = await r.json();

        setAulas(data);
        setMostrarAulas(true);
    }

    return (
        <div className="perfil_containerMain">

            <div className="perfil_cardBox">

                {!aluno && (
                    <div className="perfil_loginBox">

                        <h2 className="perfil_titleMain">
                            Área do Aluno
                        </h2>

                        <p className="perfil_loginDescricao">
                            Acesse sua matrícula para acompanhar seu progresso, visualizar suas aulas e atualizar seus dados.
                        </p>

                        <div className="perfil_loginForm">

                            <label className="perfil_labelField">Email cadastrado</label>
                            <input
                                className="perfil_inputField"
                                placeholder="Digite seu email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label className="perfil_labelField" style={{ marginTop: 15 }}>
                                Senha
                            </label>
                            <input
                                className="perfil_inputField"
                                type="password"
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />

                            <button
                                className="perfil_buttonPrimary"
                                onClick={entrar}
                                style={{ marginTop: 20 }}
                            >
                                Acessar matrícula
                            </button>

                        </div>

                        <p className="perfil_loginHint">
                            Use os dados informados no momento da sua matrícula.
                        </p>

                    </div>
                )}

                {aluno && (
                    <>
                        <h2 className="perfil_titleMain">Perfil</h2>

                        <div className="perfil_infoBlock">

                            <div className="perfil_infoItem">
                                <span className="perfil_infoLabel">Nome</span>
                                <span className="perfil_infoValue">{aluno.nome}</span>
                            </div>

                            <div className="perfil_infoItem">
                                <span className="perfil_infoLabel">Email</span>
                                <span className="perfil_infoValue">{aluno.email}</span>
                            </div>

                            <div className="perfil_infoItem">
                                <span className="perfil_infoLabel">Grupo</span>
                                <span className="perfil_infoValue">{aluno.grupo}</span>
                            </div>

                            <div className="perfil_infoItem">
                                <span className="perfil_infoLabel">Telefone</span>
                                <span className="perfil_infoValue">{aluno.telefone}</span>
                            </div>

                            <div className="perfil_infoItem">
                                <span className="perfil_infoLabel">Idade</span>
                                <span className="perfil_infoValue">{aluno.idade}</span>
                            </div>

                        </div>

                        {/* 🔥 PROGRESSO */}
                        <div className="perfil_dividerLine" />

                        <h3 className="perfil_subTitleSec">Progresso</h3>

                        <div className="perfil_infoItem">
                            <span className="perfil_infoLabel">Última aula</span>
                            <span className="perfil_infoValue">
                                {ultimaAula || "Nenhuma"}
                            </span>
                        </div>

                        <br />

                        <button
                            className="perfil_buttonPrimary"
                            onClick={carregarAulas}
                        >
                            Ver todas as aulas
                        </button>

                        {/* 🔥 LISTA DE AULAS */}
                        {mostrarAulas && (
                            <div className="perfil_aulasContainer">

                                <div className="perfil_aulasHeader">
                                    <h4 className="perfil_subTitleSec">Suas aulas</h4>
                                    <span className="perfil_aulasTotal">
                                        {aulas.length} aulas
                                    </span>
                                </div>

                                {aulas.length === 0 && (
                                    <div className="perfil_aulasEmpty">
                                        Você ainda não possui aulas registradas.
                                    </div>
                                )}

                                <div className="perfil_aulasGrid">

                                    {aulas.map((a, i) => (
                                        <div key={i} className="perfil_aulaCard">

                                            <div className="perfil_aulaNumero">
                                                Aula {a.aula}
                                            </div>

                                            <div className="perfil_aulaStatus">
                                                Concluída
                                            </div>

                                        </div>
                                    ))}

                                </div>

                            </div>
                        )}

                        {/* 🔥 ALTERAR SENHA */}
                        <div className="perfil_dividerLine" />

                        <h3 className="perfil_subTitleSec">Alterar senha</h3>

                        <input
                            className="perfil_inputField"
                            type="password"
                            placeholder="Nova senha"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                        />

                        <br /><br />

                        <button
                            className="perfil_buttonPrimary"
                            onClick={atualizarSenha}
                        >
                            Atualizar senha
                        </button>
                    </>
                )}

            </div>

        </div>
    );
}