import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "./aulas.css";

export default function Aulas() {

    const [alunos, setAlunos] = useState([]);
    const [busca, setBusca] = useState("");
    const [selecionado, setSelecionado] = useState(null);
    const [aula, setAula] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        carregarAlunos();
    }, []);

    async function carregarAlunos() {
        const r = await fetch(`${API_URL}/aulas/resumo`);
        const data = await r.json();
        setAlunos(data);
    }

    async function adicionarAula() {

        if (!selecionado) {
            alert("Selecione um aluno");
            return;
        }

        if (!aula || isNaN(aula)) {
            alert("Digite um número de aula válido");
            return;
        }

        setLoading(true);

        try {
            const r = await fetch(`${API_URL}/aulas/aula`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matricula_id: selecionado.id,
                    aula: Number(aula)
                })
            });

            const data = await r.json();

            if (!r.ok) {
                alert(data.detail || "Erro ao adicionar aula");
                return;
            }

            alert("Aula adicionada com sucesso");
            setAula("");

            carregarAlunos();

        } catch (err) {
            alert("Erro de conexão");
        } finally {
            setLoading(false);
        }
    }

    // 🔍 filtro de busca
    const filtrados = alunos.filter(a =>
        a.nome.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="aulas_container">

            {/* 🔍 BUSCA */}
            <input
                className="aulas_busca"
                placeholder="Buscar aluno..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />

            {/* 📋 LISTA */}
            <div className="aulas_lista">
                {filtrados.map(a => (
                    <div
                        key={a.id}
                        className={`aulas_item ${selecionado?.id === a.id ? "ativo" : ""}`}
                        onClick={() => setSelecionado(a)}
                    >
                        <strong>{a.nome}</strong>
                        <span>Grupo: {a.grupo || "Sem grupo"}</span>
                        <span>Aula atual: {a.ultima_aula || 0}</span>
                    </div>
                ))}
            </div>

            {/* 📦 BOX */}
            {selecionado && (
                <div className="aulas_box">

                    <h3>{selecionado.nome}</h3>
                    <p>Grupo: {selecionado.grupo || "Sem grupo"}</p>
                    <p>Última aula: {selecionado.ultima_aula || 0}</p>

                    <input
                        className="aulas_input"
                        placeholder="Número da próxima aula"
                        value={aula}
                        onChange={(e) => setAula(e.target.value)}
                    />

                    <button onClick={adicionarAula} disabled={loading}>
                        {loading ? "Salvando..." : "Adicionar aula"}
                    </button>

                </div>
            )}

        </div>
    );
}