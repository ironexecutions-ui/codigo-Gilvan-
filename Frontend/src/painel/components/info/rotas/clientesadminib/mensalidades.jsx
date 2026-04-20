// IBMensalidades.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";

import IBMensalidadeForm from "./mensform";
import "./mensalidades.css";

export default function IBMensalidades() {

    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);

    async function carregar() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/ib/mensalidades`);
            const json = await res.json();
            setLista(json);
        } catch (err) {
            console.log("Erro ao carregar mensalidades", err);
        } finally {
            setLoading(false);
        }
    }
    function formatarDataMaisUmDia(dataStr) {
        if (!dataStr) return "";

        const data = new Date(dataStr);
        data.setDate(data.getDate() + 1);

        return data.toLocaleDateString("pt-BR");
    }

    useEffect(() => {
        carregar();
    }, []);

    function enviarWhatsApp(item) {
        if (!item.celular) {
            alert("Celular do cliente não informado");
            return;
        }

        const linkPagamento = `https://ironexecutions.com.br/pagamento/${item.id}`;

        const mensagem = `
Olá ${item.loja}, tudo bem? 👋

Estamos entrando em contato para lembrar sobre a mensalidade do seu serviço IronExecutions.

Valor: R$ ${Number(item.valor).toFixed(2)}
Referente ao Dia: ${formatarDataMaisUmDia(item.data_inicio)}

Você pode realizar o pagamento diretamente pelo link abaixo:
${linkPagamento}

Caso prefira, também é possível pagar via PIX:
📲 Chave PIX: 11escolha um numero7818

Se optar pelo PIX, pedimos por gentileza que envie o comprovante neste WhatsApp.

Qualquer dúvida, ficamos à disposição.
        `.trim();

        const numero = item.celular.replace(/\D/g, "");
        const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;

        window.open(url, "_blank");
    }

    return (
        <div className="mens-container">

            {/* CABEÇALHO */}
            <div className="mens-header">
                <h3 className="mens-titulo">Mensalidades</h3>

                <button
                    className="mens-btn-add"
                    onClick={() => setMostrarForm(true)}
                >
                    Adicionar
                </button>
            </div>

            {/* MODAL FORM */}
            {mostrarForm && (
                <IBMensalidadeForm
                    fechar={() => setMostrarForm(false)}
                    recarregar={carregar}
                />
            )}

            {/* ESTADOS */}
            {loading ? (
                <p className="mens-info">Carregando mensalidades...</p>
            ) : lista.length === 0 ? (
                <p className="mens-info">Nenhuma mensalidade encontrada.</p>
            ) : (

                <table className="mens-tabela">
                    <thead>
                        <tr>
                            <th>Loja</th>
                            <th>Data início</th>
                            <th>Valor</th>
                            <th>Situação</th>
                            <th>Cobrança</th>
                        </tr>
                    </thead>

                    <tbody>
                        {lista.map(item => (
                            <tr key={item.id} className="mens-linha">

                                <td className="mens-loja">
                                    {item.imagem ? (
                                        <img
                                            src={item.imagem}
                                            alt={item.loja}
                                            className="mens-img"
                                        />
                                    ) : (
                                        <div className="mens-img-placeholder">—</div>
                                    )}
                                    <span className="mens-loja-nome">{item.loja}</span>
                                </td>

                                <td className="mens-data">
                                    {formatarDataMaisUmDia(item.data_inicio)}
                                </td>

                                <td className="mens-valor">
                                    R$ {Number(item.valor).toFixed(2)}
                                </td>

                                <td className="mens-situacao">
                                    <span
                                        className={`mens-status mens-${item.comercio_id === 11 ? "admin" : item.situacao}`}
                                    >
                                        {item.comercio_id === 11 ? "admin" : item.situacao}
                                    </span>
                                </td>

                                <td className="mens-link">
                                    <button
                                        className="mens-btn-link"
                                        onClick={() => enviarWhatsApp(item)}
                                    >
                                        Enviar cobrança
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

        </div>
    );
}
