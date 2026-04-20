import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { API_URL } from "../../config";
import "./pagamentos.css";

export default function Aula_pagamentos() {

    const { id } = useParams();
    const [dados, setDados] = useState(null);
    const [pixData, setPixData] = useState(null);

    useEffect(() => {
        initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
            locale: "pt-BR"
        });
        carregar();
    }, []);

    async function carregar() {
        const r = await fetch(`${API_URL}/pagamento/${id}`);
        const data = await r.json();
        setDados(data);
    }

    // 🔥 PAGAMENTO CARTÃO
    async function onSubmitPayment(formData) {
        try {
            const r = await fetch(`${API_URL}/pagamento/processar/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const res = await r.json();

            if (res.status === "approved" || res.status === "pending") {
                alert("Pagamento aprovado!");
                carregar();
                return Promise.resolve();
            } else {
                alert("Pagamento recusado");
                return Promise.reject();
            }

        } catch (e) {
            console.error(e);
            return Promise.reject();
        }
    }

    // 🔥 GERAR PIX
    async function gerarPix() {
        const r = await fetch(`${API_URL}/pagamento/pix/${id}`, {
            method: "POST"
        });

        const data = await r.json();
        setPixData(data);

        // 🔥 ATUALIZA A TELA
        carregar();
    }
    if (!dados) return <div className="pagamento_loading">Carregando...</div>;

    return (
        <div className="pagamento_container_main">

            <div className="pagamento_card_box">

                <div className="pagamento_header_box">
                    <h1>Pagamento</h1>

                    <span>ID #{id}</span>
                </div>
                <div className="pagamento_info_topo">
                    <p className="rep_nome">
                        {dados.representante_nome}
                    </p>

                    <p className="aluno_nome">
                        Pagamento mensal das aulas de {dados.aluno_nome}
                    </p>
                </div>
                {dados.pago === 1 ? (
                    <div className="pagamento_status_pago">
                        <h2>Pagamento aprovado</h2>

                        <div className="pagamento_info_grid">
                            <p><strong>Valor:</strong> R$ {dados.quanto}</p>
                            <p><strong>Data:</strong> {dados.data_pagamento}</p>
                            <p><strong>Método:</strong> {dados.tipo_pagamento}</p>
                        </div>
                    </div>
                ) : (
                    <div className="pagamento_status_pendente">

                        <h2>Pagamento pendente</h2>

                        <div className="pagamento_valor_box">
                            <span>Valor</span>
                            <strong>R$ {dados.quanto}</strong>
                        </div>

                        <div className="pagamento_opcoes">

                            {/* BOTÃO PIX */}
                            <button className="botao_pix" onClick={gerarPix}>
                                Pagar com PIX
                            </button>

                            {/* CARTÃO */}
                            {!pixData && (
                                <div className="pagamento_brick_box">
                                    <Payment
                                        initialization={{
                                            amount: Number(dados.quanto),
                                            payer: {
                                                email: "test_user@test.com"
                                            }
                                        }}
                                        onSubmit={onSubmitPayment}
                                        customization={{
                                            paymentMethods: {
                                                creditCard: "all",
                                                debitCard: "all" // 🔥 garante débito visível
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* PIX */}
                            {pixData && (
                                <div className="pix_box">

                                    <img
                                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                        alt="QR Code PIX"
                                    />

                                    <textarea
                                        readOnly
                                        value={pixData.qr_code}
                                    />

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(pixData.qr_code);
                                            alert("Código copiado!");
                                        }}
                                    >
                                        Copiar código PIX
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}