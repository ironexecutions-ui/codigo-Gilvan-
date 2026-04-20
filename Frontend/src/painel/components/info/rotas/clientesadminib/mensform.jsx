// IBMensalidadeForm.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";

import "./mensform.css"

export default function IBMensalidadeForm({ fechar, recarregar }) {

    const [comercios, setComercios] = useState([]);
    const [lojaDigitada, setLojaDigitada] = useState("");
    const [comercioId, setComercioId] = useState(null);

    const hoje = new Date().toISOString().slice(0, 10);
    const [dataInicio, setDataInicio] = useState(hoje);
    const [valor, setValor] = useState("");

    // ===============================
    // CARREGAR COMÉRCIOS
    // ===============================
    useEffect(() => {
        async function carregarComercios() {
            try {
                const res = await fetch(`${API_URL}/ib/comercios`);
                const json = await res.json();
                setComercios(json);
            } catch (err) {
                console.log("Erro ao carregar comércios", err);
            }
        }

        carregarComercios();
    }, []);

    // ===============================
    // SELECIONAR LOJA PELO NOME
    // ===============================
    function selecionarLoja(valorInput) {
        setLojaDigitada(valorInput);

        const comercio = comercios.find(
            c => c.loja.toLowerCase() === valorInput.toLowerCase()
        );

        setComercioId(comercio ? comercio.id : null);
    }

    // ===============================
    // SALVAR
    // ===============================
    async function salvar(e) {
        e.preventDefault();

        if (!comercioId) {
            alert("Selecione uma loja válida da lista");
            return;
        }

        const dados = {
            comercio_id: comercioId,
            data_mes: hoje,     // 👈 data atual enviada para o backend
            valor: valor,
            situacao: "espera"
        };


        try {
            await fetch(`${API_URL}/ib/mensalidades`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            fechar();
            recarregar();

        } catch (err) {
            console.log("Erro ao salvar mensalidade", err);
        }
    }

    return (
        <div className="ib-modal-overlay">
            <div className="ib-modal">

                <h3>Adicionar mensalidade</h3>

                <form onSubmit={salvar} className="ib-form">

                    <label>Loja</label>
                    <input
                        list="lista-comercios"
                        value={lojaDigitada}
                        onChange={e => selecionarLoja(e.target.value)}
                        placeholder="Digite ou selecione a loja"
                        required
                    />

                    <datalist id="lista-comercios">
                        {comercios.map(c => (
                            <option key={c.id} value={c.loja} />
                        ))}
                    </datalist>

                    <label>Data início</label>
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                        required
                    />

                    <label>Valor</label>
                    <input
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        required
                    />

                    <div className="ib-form-botoes">
                        <button type="submit" className="ib-btn ativo">
                            Salvar
                        </button>

                        <button type="button" className="ib-btn" onClick={fechar}>
                            Cancelar
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
}
