import React, { useEffect, useState } from "react";
import "./clientesadmin.css";
import { API_URL } from "../../config";
import ClientesAdminIB from "./clientesadminib";

export default function ClientesAdmin() {

    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("todos");

    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [idEditando, setIdEditando] = useState(null);

    const [cliente, setCliente] = useState("");
    const [loja, setLoja] = useState("");
    const [data, setData] = useState(dataHoje());
    const [valor, setValor] = useState("");
    const [dias, setDias] = useState("");
    const [link, setLink] = useState("");
    const [processo, setProcesso] = useState("contratacao");
    const [modoIB, setModoIB] = useState(false);

    const [confirmarApagar, setConfirmarApagar] = useState(null);

    function dataHoje() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    // Filtrar por processo
    const servicosFiltrados = servicos.filter(s => {
        if (filtro === "todos") return true;
        return s.processo === filtro;
    });

    // Carregar serviços
    useEffect(() => {
        async function carregar() {
            try {
                const res = await fetch(`${API_URL}/servicos`);
                const json = await res.json();
                setServicos(json);
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, []);

    // Cadastrar novo
    async function cadastrar(e) {
        e.preventDefault();

        const novo = { cliente, loja, data, valor, dias, link, processo };

        try {
            await fetch(`${API_URL}/servicos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novo)
            });

            setMostrarModal(false);

            const res = await fetch(`${API_URL}/servicos`);
            const json = await res.json();
            setServicos(json);

            limparCampos();

        } catch (err) {
            console.log("Erro ao cadastrar", err);
        }
    }

    function limparCampos() {
        setCliente("");
        setLoja("");
        setData(dataHoje());
        setValor("");
        setDias("");
        setLink("");
        setProcesso("contratacao");
        setModoEdicao(false);
        setIdEditando(null);
    }

    // Apagar com 2 cliques
    async function apagar(id) {
        if (confirmarApagar !== id) {
            setConfirmarApagar(id);
            setTimeout(() => setConfirmarApagar(null), 3000);
            return;
        }

        try {
            await fetch(`${API_URL}/servicos/${id}`, {
                method: "DELETE"
            });

            setServicos(servicos.filter(s => s.id !== id));
            setConfirmarApagar(null);

        } catch (err) {
            console.log("Erro ao apagar", err);
        }
    }

    // Editar
    function editar(servico) {
        setModoEdicao(true);
        setIdEditando(servico.id);

        setCliente(servico.cliente);
        setLoja(servico.loja);
        setData(servico.data);
        setValor(servico.valor);
        setDias(servico.dias);
        setLink(servico.link || "");
        setProcesso(servico.processo || "andamento");

        setMostrarModal(true);
    }

    // Atualizar
    async function atualizar(e) {
        e.preventDefault();

        const dados = { cliente, loja, data, valor, dias, link, processo };

        try {
            await fetch(`${API_URL}/servicos/${idEditando}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            setMostrarModal(false);

            const res = await fetch(`${API_URL}/servicos`);
            const json = await res.json();
            setServicos(json);

            limparCampos();

        } catch (err) {
            console.log("Erro ao atualizar", err);
        }
    }

    return (
        <div className="cli-container">

            {/* TOPO */}
            <div className="cli-top">
                <h2
                    className="cli-titulo cli-titulo-click"
                    onClick={() => setModoIB(!modoIB)}
                >
                    {modoIB
                        ? "Serviços IronBusiness"
                        : "Serviços de criação de sistemas registrados"}
                </h2>

                {!modoIB && (
                    <button
                        className="cli-adicionar"
                        onClick={() => {
                            limparCampos();
                            setMostrarModal(true);
                        }}
                    >
                        Adicionar Serviço
                    </button>
                )}
            </div>

            {/* CONTEÚDO */}
            {modoIB ? (

                <ClientesAdminIB voltar={() => setModoIB(false)} />

            ) : (

                <>
                    {/* CONTADORES CLICÁVEIS */}
                    <div className="cli-stats">
                        <span
                            className={filtro === "todos" ? "stat-ativo" : ""}
                            onClick={() => setFiltro("todos")}
                        >
                            Total: {servicos.length}
                        </span>

                        <span
                            className={filtro === "andamento" ? "stat-ativo" : ""}
                            onClick={() => setFiltro("andamento")}
                        >
                            Em andamento: {servicos.filter(s => s.processo === "andamento").length}
                        </span>

                        <span
                            className={filtro === "contratacao" ? "stat-ativo" : ""}
                            onClick={() => setFiltro("contratacao")}
                        >
                            Contratação: {servicos.filter(s => s.processo === "contratacao").length}
                        </span>

                        <span
                            className={filtro === "finalizado" ? "stat-ativo" : ""}
                            onClick={() => setFiltro("finalizado")}
                        >
                            Finalizados: {servicos.filter(s => s.processo === "finalizado").length}
                        </span>
                    </div>

                    {/* TABELA */}
                    {loading ? (
                        <p style={{ color: "white" }}>Carregando...</p>
                    ) : (
                        <table className="cli-tabela">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Loja</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Dias</th>
                                    <th>Link</th>
                                    <th>Processo</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {servicosFiltrados.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.cliente}</td>
                                        <td>{s.loja}</td>
                                        <td>{s.data}</td>
                                        <td>R$ {Number(s.valor).toFixed(2)}</td>
                                        <td>{s.dias}</td>

                                        <td>
                                            {s.link ? (
                                                <a
                                                    href={s.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="cli-link"
                                                >
                                                    Abrir
                                                </a>
                                            ) : "Nenhum"}
                                        </td>

                                        <td className={`proc proc-${s.processo}`}>
                                            {s.processo}
                                        </td>

                                        <td>
                                            <button
                                                className="cli-editar"
                                                onClick={() => editar(s)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                className="cli-apagar"
                                                onClick={() => apagar(s.id)}
                                            >
                                                {confirmarApagar === s.id
                                                    ? "Confirmar"
                                                    : "Apagar"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* MODAL */}
            {mostrarModal && (
                <div
                    className="cli-modal-overlay"
                    onClick={() => setMostrarModal(false)}
                >
                    <div
                        className="cli-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="cli-modal-titulo">
                            {modoEdicao ? "Editar Serviço" : "Cadastrar Serviço"}
                        </h2>

                        <form
                            onSubmit={modoEdicao ? atualizar : cadastrar}
                            className="cli-form"
                        >
                            <input
                                type="text"
                                placeholder="Cliente"
                                value={cliente}
                                onChange={(e) => setCliente(e.target.value)}
                                required
                            />

                            <input
                                type="text"
                                placeholder="Loja"
                                value={loja}
                                onChange={(e) => setLoja(e.target.value)}
                                required
                            />

                            <input
                                type="date"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                required
                            />

                            <input
                                type="number"
                                step="0.01"
                                placeholder="Valor"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                required
                            />

                            <input
                                type="number"
                                placeholder="Dias"
                                value={dias}
                                onChange={(e) => setDias(e.target.value)}
                                required
                            />

                            <input
                                type="text"
                                placeholder="Link (opcional)"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                            />

                            <select
                                value={processo}
                                onChange={(e) => setProcesso(e.target.value)}
                                required
                            >
                                <option value="contratacao">Contratação</option>
                                <option value="andamento">Em andamento</option>
                                <option value="finalizado">Finalizado</option>
                            </select>

                            <button className="cli-salvar" type="submit">
                                {modoEdicao ? "Atualizar" : "Salvar"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );

}
