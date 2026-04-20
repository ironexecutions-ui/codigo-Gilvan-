import React, { useEffect, useState } from "react";
import { API_URL } from "../../config";
import "./horasform.css";

const EMPRESAS = {
    "Quatro Águias": "5511963638339",
    "Missionary Store Brasil": "5511994381409",
    "Dass": "558698104089"
};

function getMonday(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function getSunday(monday) {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
}

function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function HorasForm() {
    const [form, setForm] = useState({
        semana_inicio: "",
        semana_fim: "",
        horas: "",
        de_ate: "",
        relato: "",
        empresa: ""
    });

    useEffect(() => {
        const monday = getMonday(new Date());
        const sunday = getSunday(monday);

        setForm(f => ({
            ...f,
            semana_inicio: formatDateLocal(monday),
            semana_fim: formatDateLocal(sunday)
        }));
    }, []);

    function alterarInicio(valor) {
        if (!valor) return;

        const data = new Date(`${valor}T12:00:00`);

        if (data.getDay() !== 1) return;

        const sunday = getSunday(data);

        setForm(f => ({
            ...f,
            semana_inicio: formatDateLocal(data),
            semana_fim: formatDateLocal(sunday)
        }));
    }

    function montarMensagem() {
        return (
            `Olá ${form.empresa},\n\n` +
            `Aqui está o relato sobre o trabalho realizado na semana de\n` +
            `${form.semana_inicio} até ${form.semana_fim}.\n\n` +
            `${form.relato}`
        );
    }

    function enviarWhatsApp() {
        const telefone = EMPRESAS[form.empresa];
        if (!telefone) return;

        const mensagem = encodeURIComponent(montarMensagem());
        const url = `https://wa.me/${telefone}?text=${mensagem}`;

        window.open(url, "_blank");
    }

    function enviar() {
        const token = localStorage.getItem("token");

        fetch(`${API_URL}/horas/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(form)
        })
            .then(() => {
                if (form.empresa) {
                    enviarWhatsApp();
                }
                window.location.reload();
            });
    }

    return (
        <div className="hrs-form-card">
            <h3 className="hrs-form-title">Registrar horas</h3>

            <div className="hrs-form-grid">
                <div className="hrs-form-field">
                    <label className="hrs-form-label">Empresa</label>
                    <select
                        className="hrs-form-input"
                        value={form.empresa}
                        onChange={e => setForm({ ...form, empresa: e.target.value })}
                    >
                        <option value="">Selecione</option>
                        {Object.keys(EMPRESAS).map(nome => (
                            <option key={nome} value={nome}>{nome}</option>
                        ))}
                    </select>
                </div>

                <div className="hrs-form-field">
                    <label className="hrs-form-label">Semana início (segunda)</label>
                    <input
                        type="date"
                        className="hrs-form-input"
                        value={form.semana_inicio}
                        onChange={e => alterarInicio(e.target.value)}
                    />
                </div>

                <div className="hrs-form-field">
                    <label className="hrs-form-label">Semana fim (domingo)</label>
                    <input
                        type="date"
                        className="hrs-form-input"
                        value={form.semana_fim}
                        readOnly
                    />
                </div>

                <div className="hrs-form-field">
                    <label className="hrs-form-label">Horas trabalhadas</label>
                    <input
                        type="number"
                        step="0.25"
                        className="hrs-form-input"
                        value={form.horas}
                        onChange={e => setForm({ ...form, horas: e.target.value })}
                    />
                </div>


            </div>

            <div className="hrs-form-field hrs-form-textarea">
                <label className="hrs-form-label">Relato</label>
                <textarea
                    className="hrs-form-textarea-input"
                    value={form.relato}
                    onChange={e => setForm({ ...form, relato: e.target.value })}
                />
            </div>

            <div className="hrs-form-actions">
                <button className="hrs-btn hrs-btn-salvar" onClick={enviar}>
                    Salvar e enviar WhatsApp
                </button>
            </div>
        </div>
    );
}
