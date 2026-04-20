// IBServicos.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";

import "./servicos.css";

export default function IBServicos() {

    const [servicos, setServicos] = useState([]);
    const [alugueis, setAlugueis] = useState([]);

    const [lojaSelecionada, setLojaSelecionada] = useState("");
    const [aluguelId, setAluguelId] = useState(null);

    const [servico, setServico] = useState("");
    const [valor, setValor] = useState("");

    const [erro, setErro] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    function selecionarServicoParaEdicao(s) {
        setEditandoId(s.id);
        setServico(s.servico);
        setValor(String(s.valor));
        setAluguelId(s.servico_ib_id);

        const aluguel = alugueis.find(a => a.aluguel_id === s.servico_ib_id);
        setLojaSelecionada(aluguel ? aluguel.loja : "");
    }

    useEffect(() => {
        carregarTudo();
    }, []);

    async function carregarTudo() {
        const s = await fetch(`${API_URL}/ib/servicos`).then(r => r.json());
        const a = await fetch(`${API_URL}/ib/alugueis`).then(r => r.json());

        setServicos(Array.isArray(s) ? s : []);
        setAlugueis(Array.isArray(a) ? a : []);
    }

    function selecionarLoja(nome) {
        setLojaSelecionada(nome);

        const encontrado = alugueis.find(a => a.loja === nome);
        setAluguelId(encontrado ? encontrado.aluguel_id : null);
    }

    async function salvar(e) {
        e.preventDefault();
        setErro("");

        if (!aluguelId) {
            setErro("Selecione uma loja válida");
            return;
        }

        if (!servico.trim()) {
            setErro("Informe o serviço");
            return;
        }

        if (!valor || Number(valor) <= 0) {
            setErro("Valor inválido");
            return;
        }

        const url = editandoId
            ? `${API_URL}/ib/servicos/${editandoId}`
            : `${API_URL}/ib/servicos`;

        const method = editandoId ? "PUT" : "POST";

        const resp = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                servico_ib_id: aluguelId,
                servico,
                valor
            })
        });

        if (!resp.ok) {
            setErro("Erro ao salvar serviço");
            return;
        }

        limparFormulario();
        carregarTudo();
    }
    function limparFormulario() {
        setEditandoId(null);
        setServico("");
        setValor("");
        setLojaSelecionada("");
        setAluguelId(null);
        setErro("");
    }
    async function apagarServico() {
        if (!editandoId) return;

        const confirmar = window.confirm("Deseja realmente apagar este serviço?");
        if (!confirmar) return;

        const resp = await fetch(
            `${API_URL}/ib/servicos/${editandoId}`,
            { method: "DELETE" }
        );

        if (!resp.ok) {
            setErro("Erro ao apagar serviço");
            return;
        }

        limparFormulario();
        carregarTudo();
    }


    const sugestoesFixas = [
        "Instalação do Node para impressão de comanda",
        "Registro inicial de produtos",
        "Configuração de impressora térmica",
        "Configuração de usuários e permissões",
        "Treinamento inicial do sistema",
        "Ajustes personalizados no sistema"
    ];

    return (
        <div className="ib-wrapper">

            <div className="ib-header">
                <h2 className="ib-title">Serviços IronBusiness</h2>
                <p className="ib-subtitle">
                    Cadastro, controle e histórico de serviços vinculados aos comércios
                </p>
            </div>

            <form className="ib-form" onSubmit={salvar}>

                <div className="ib-grid">

                    <div className="ib-field">
                        <label className="ib-label">Loja</label>
                        <input
                            className="ib-input"
                            list="lista-lojas"
                            value={lojaSelecionada}
                            onChange={e => selecionarLoja(e.target.value)}
                            placeholder="Digite ou selecione a loja"
                        />
                        <datalist id="lista-lojas">
                            {alugueis.map(a => (
                                <option key={a.aluguel_id} value={a.loja} />
                            ))}
                        </datalist>
                    </div>

                    <div className="ib-field ib-field-full">
                        <label className="ib-label">Serviço prestado</label>
                        <textarea
                            className="ib-textarea"
                            list="lista-servicos"
                            value={servico}
                            onChange={e => setServico(e.target.value)}
                            placeholder="Descreva o serviço realizado"
                        />
                        <datalist id="lista-servicos">
                            {servicos.map(s => (
                                <option key={s.id} value={s.servico} />
                            ))}
                            {sugestoesFixas.map((s, i) => (
                                <option key={`fixo-${i}`} value={s} />
                            ))}
                        </datalist>
                    </div>

                    <div className="ib-field">
                        <label className="ib-label">Valor</label>
                        <input
                            className="ib-input"
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                            placeholder="0,00"
                        />
                    </div>

                </div>

                {erro && <div className="ib-error">{erro}</div>}

                <div className="ib-actions">
                    <button className="ib-btn-primary" type="submit">
                        {editandoId ? "Salvar edição" : "Adicionar serviço"}
                    </button>

                    {editandoId && (
                        <button
                            type="button"
                            className="ib-btn-danger"
                            onClick={apagarServico}
                        >
                            Apagar
                        </button>
                    )}
                </div>


            </form>

            <div className="ib-table-wrapper">
                <table className="ib-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Aluguel</th>
                            <th>Serviço</th>
                            <th>Valor</th>
                        </tr>
                    </thead>

                    <tbody>
                        {servicos.map(s => (
                            <tr
                                key={s.id}
                                onClick={() => selecionarServicoParaEdicao(s)}
                                className={editandoId === s.id ? "ib-row-active" : ""}
                            >
                                <td className="ib-date">
                                    {new Date(s.data).toLocaleDateString("pt-BR")}
                                </td>
                                <td>{s.loja}</td>
                                <td>{s.servico}</td>
                                <td className="ib-money">
                                    R$ {Number(s.valor).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>


        </div>
    );

}
