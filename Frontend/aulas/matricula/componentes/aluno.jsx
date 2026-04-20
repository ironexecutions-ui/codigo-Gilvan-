import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "./aluno.css";

export default function Alunos() {

    const [resumo, setResumo] = useState([]);
    const [editando, setEditando] = useState(null);
    const [buscaGrupo, setBuscaGrupo] = useState("");

    useEffect(() => {
        carregarResumo();
    }, []);

    async function carregarResumo() {
        const r = await fetch(`${API_URL}/aulas/resumo`);
        const data = await r.json();
        setResumo(data);
    }

    async function selecionarAluno(id) {
        const r = await fetch(`${API_URL}/aulas/matricula/${id}`);
        const data = await r.json();
        setEditando(data);
    }

    async function salvar() {

        const payload = {
            ...editando,
            idade: Number(editando.idade)
        };

        const r = await fetch(`${API_URL}/aulas/matricula/${editando.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await r.json();

        if (!r.ok) {
            alert(data.detail || "Erro ao atualizar");
            return;
        }

        alert("Atualizado com sucesso");
        carregarResumo();
    }

    // 🔥 AGRUPAR POR GRUPO
    const agrupados = resumo.reduce((acc, aluno) => {

        const grupo = aluno.grupo || "Sem grupo";

        // 🔍 filtro
        if (buscaGrupo && !grupo.toLowerCase().includes(buscaGrupo.toLowerCase())) {
            return acc;
        }

        if (!acc[grupo]) {
            acc[grupo] = [];
        }

        acc[grupo].push(aluno);
        return acc;

    }, {});

    return (
        <div className="alunos_container">

            {/* LISTA */}
            <div className="alunos_lista">

                {/* 🔍 INPUT DE BUSCA */}
                <input
                    className="alunos_busca"
                    placeholder="Buscar grupo..."
                    value={buscaGrupo}
                    onChange={(e) => setBuscaGrupo(e.target.value)}
                />

                {/* 🔥 LISTA AGRUPADA */}
                {Object.entries(agrupados).map(([grupo, alunos]) => (
                    <div key={grupo} className="grupo_bloco">

                        <h4 className="grupo_titulo">{grupo}</h4>

                        {alunos.map(a => (
                            <div
                                key={a.id}
                                className="aluno_item"
                                onClick={() => selecionarAluno(a.id)}
                            >
                                {a.nome} | Aula: {a.ultima_aula || 0}
                            </div>
                        ))}

                    </div>
                ))}

            </div>

            {/* EDITAR */}
            <div className="alunos_editar">

                {editando && (
                    <div className="perfil_editBox">

                        <h3 className="perfil_subTitleSec">
                            Editar dados do aluno
                        </h3>

                        {/* NOME */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Nome completo</label>
                            <input
                                className="perfil_inputField"
                                value={editando.nome || ""}
                                onChange={e => setEditando({ ...editando, nome: e.target.value })}
                            />
                        </div>

                        {/* EMAIL */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Email</label>
                            <input
                                className="perfil_inputField"
                                value={editando.email || ""}
                                onChange={e => setEditando({ ...editando, email: e.target.value })}
                            />
                        </div>

                        {/* TELEFONE */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Telefone</label>
                            <input
                                className="perfil_inputField"
                                placeholder="(99) 99999-9999"
                                value={editando.telefone || ""}
                                onChange={(e) => {
                                    let valor = e.target.value.replace(/\D/g, "");

                                    if (valor.length > 11) valor = valor.slice(0, 11);

                                    if (valor.length > 6) {
                                        valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
                                    } else if (valor.length > 2) {
                                        valor = valor.replace(/(\d{2})(\d{0,5})/, "($1) $2");
                                    } else {
                                        valor = valor.replace(/(\d*)/, "($1");
                                    }

                                    setEditando({ ...editando, telefone: valor });
                                }}
                            />
                        </div>

                        {/* SENHA */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Senha</label>
                            <input
                                className="perfil_inputField"
                                type="password"
                                value={editando.senha || ""}
                                onChange={e => setEditando({ ...editando, senha: e.target.value })}
                            />
                        </div>

                        {/* IDADE */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Idade</label>
                            <input
                                className="perfil_inputField"
                                type="number"
                                value={editando.idade || ""}
                                onChange={e => setEditando({ ...editando, idade: e.target.value })}
                            />
                        </div>

                        {/* GRUPO */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Grupo</label>
                            <input
                                className="perfil_inputField"
                                placeholder="Ex: Turma A"
                                value={editando.grupo || ""}
                                onChange={e => setEditando({ ...editando, grupo: e.target.value })}
                            />
                        </div>

                        {/* DATA */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Data de início</label>
                            <input
                                className="perfil_inputField"
                                type="date"
                                value={editando.data_inicio || ""}
                                onChange={e => setEditando({ ...editando, data_inicio: e.target.value })}
                            />
                        </div>

                        {/* HORÁRIOS */}
                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Dia 1 (horário)</label>
                            <input
                                className="perfil_inputField"
                                placeholder="Ex: Quarta 09:00-10:30"
                                value={editando.diaum || ""}
                                onChange={e => setEditando({ ...editando, diaum: e.target.value })}
                            />
                        </div>

                        <div className="perfil_formGroup">
                            <label className="perfil_labelField">Dia 2 (horário)</label>
                            <input
                                className="perfil_inputField"
                                placeholder="Ex: Sexta 09:00-10:30"
                                value={editando.diadois || ""}
                                onChange={e => setEditando({ ...editando, diadois: e.target.value })}
                            />
                        </div>

                        {/* BOTÃO */}
                        <button
                            className="perfil_buttonPrimary"
                            style={{ marginTop: 20 }}
                            onClick={salvar}
                        >
                            Salvar alterações
                        </button>

                    </div>
                )}

            </div>

        </div>
    );
}