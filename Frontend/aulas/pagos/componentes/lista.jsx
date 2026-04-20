import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "./lista.css"
export default function Lista() {

    const [lista, setLista] = useState([]);
    const [representantes, setRepresentantes] = useState([]);
    const [abrirModal, setAbrirModal] = useState(false);

    const [form, setForm] = useState({
        representante_id: "",
        data_pagamento: "",
        quanto: 300
    });

    useEffect(() => {
        carregar();
        carregarRepresentantes();
    }, []);

    async function carregar() {
        const r = await fetch(`${API_URL}/pagos`);
        const data = await r.json();
        setLista(data);
    }

    async function carregarRepresentantes() {
        const r = await fetch(`${API_URL}/pagos/representantes`);
        const data = await r.json();
        setRepresentantes(data);
    }

    function atualizar(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }));
    }

    async function salvar() {

        const r = await fetch(`${API_URL}/pagos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        if (r.ok) {
            setAbrirModal(false);
            carregar();
        }
    }

    return (
        <div className="lista_container">

            <button
                className="lista_botao"
                onClick={() => setAbrirModal(true)}
            >
                + Cadastrar
            </button>

            <table className="lista_table">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Representante</th>
                        <th>Valor</th>
                        <th>Data</th>
                    </tr>
                </thead>

                <tbody>
                    {lista.map(p => (
                        <tr key={p.id}>
                            <td>{p.nome_aluno}</td>
                            <td>{p.nome_representante}</td>
                            <td>R$ {p.quanto}</td>
                            <td>
                                {new Date(p.data_pagamento).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                })}
                            </td>                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL */}
            {abrirModal && (
                <div className="modal_bg">

                    <div className="modal_box">

                        <h3>Novo pagamento</h3>

                        <input
                            className="modal_input"
                            list="rep"
                            placeholder="Representante"
                            onChange={(e) => {
                                const nome = e.target.value;
                                const rep = representantes.find(r => r.nome_completo === nome);
                                if (rep) atualizar("representante_id", rep.id);
                            }}
                        />

                        <datalist id="rep">
                            {representantes.map(r => (
                                <option key={r.id} value={r.nome_completo} />
                            ))}
                        </datalist>

                        <input
                            className="modal_input"
                            type="date"
                            onChange={e => atualizar("data_pagamento", e.target.value)}
                        />

                        <input
                            className="modal_input"
                            value={form.quanto}
                            onChange={e => atualizar("quanto", e.target.value)}
                        />

                        <button className="modal_salvar" onClick={salvar}>
                            Salvar
                        </button>

                        <button
                            className="modal_fechar"
                            onClick={() => setAbrirModal(false)}
                        >
                            Fechar
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}