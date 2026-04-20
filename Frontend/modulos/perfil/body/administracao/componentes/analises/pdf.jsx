import React, { useState, useEffect } from "react";
import { API_URL } from "../../../../../../config";
import "./pdf.css";
export default function ContabilidadePdf() {

    const hoje = new Date().toISOString().split("T")[0];

    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState(hoje);

    const podeGerar = dataInicio && dataFim;

    function gerarPdf() {
        const token = localStorage.getItem("token");

        const url = `${API_URL}/admin/contabilidade/pdf/pdf?data_inicio=${dataInicio}&data_fim=${dataFim}`;

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(resp => {
                if (!resp.ok) throw new Error("Erro ao gerar PDF");
                return resp.blob();
            })
            .then(blob => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `contabilidade_${dataInicio}_a_${dataFim}.pdf`;
                link.click();
            })
            .catch(() => {
                alert("Não foi possível gerar o PDF");
            });
    }

    return (
        <div className="contabilidade-pdf-wrapper">

            <div className="contabilidade-pdf-header">
                <span className="contabilidade-pdf-title">
                    Gerar relatório em PDF
                </span>
                <span className="contabilidade-pdf-subtitle">
                    Selecione o período desejado
                </span>
            </div>

            <div className="contabilidade-pdf-form">

                <div className="contabilidade-pdf-field">
                    <label className="contabilidade-pdf-label">
                        Data inicial
                    </label>
                    <input
                        className="contabilidade-pdf-input"
                        type="date"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                    />
                </div>

                <div className="contabilidade-pdf-field">
                    <label className="contabilidade-pdf-label">
                        Data final
                    </label>
                    <input
                        className="contabilidade-pdf-input"
                        type="date"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                    />
                </div>

                <div className="contabilidade-pdf-action">
                    <button
                        className="contabilidade-pdf-button"
                        disabled={!podeGerar}
                        onClick={gerarPdf}
                    >
                        Baixar PDF
                    </button>
                </div>

            </div>

        </div>
    );

}
