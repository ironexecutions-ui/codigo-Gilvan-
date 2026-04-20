import React, { useEffect, useState } from "react";
import { API_URL } from "../../config";
import "./horasdetalhes.css";

export default function HorasDetalhes({ semanaInicio, onLoaded }) {
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [usuario, setUsuario] = useState(null);

    function carregarDados() {
        const token = localStorage.getItem("token");
        setCarregando(true);

        fetch(`${API_URL}/horas/detalhes?semana_inicio=${semanaInicio}`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(res => {
                setDados(res);
                setCarregando(false);
                if (onLoaded) onLoaded();
            });
    }

    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch(`${API_URL}/retorno/me`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(setUsuario);
    }, []);

    useEffect(() => {
        if (semanaInicio) {
            carregarDados();
        }
    }, [semanaInicio]);

    function apagarRegistro(id) {
        if (!window.confirm("Deseja realmente apagar este registro?")) return;

        const token = localStorage.getItem("token");

        fetch(`${API_URL}/horas/apagar/${id}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        }).then(() => {
            carregarDados();
        });
    }
    function enviarWhatsapp(registro) {
        const numero = "5511escolha um numero7818";

        const texto = `
Olá,
Estou entrando em contato sobre um registro de horas.

Horas: ${registro.horas}h
${registro.relato ? `Relato: ${registro.relato}` : ""}
    `.trim();

        const mensagem = encodeURIComponent(texto);
        const url = `https://wa.me/${numero}?text=${mensagem}`;

        window.open(url, "_blank", "noopener,noreferrer");
    }


    return (
        <div className="hrs-det-card">
            <h3 className="hrs-det-title">Detalhes da semana</h3>

            {carregando && (
                <p className="hrs-det-loading">Carregando detalhes...</p>
            )}

            {!carregando && dados.length === 0 && (
                <p className="hrs-det-empty">
                    Nenhum registro encontrado para esta semana.
                </p>
            )}

            {!carregando && dados.length > 0 && (
                <div className="hrs-det-list">
                    {dados.map(d => (
                        <div key={d.id} className="hrs-det-item">
                            <div className="hrs-det-header">
                                <span className="hrs-det-horas">
                                    {d.horas}h
                                </span>
                                <button
                                    className="hrs-btn-whatsapp"
                                    onClick={() => enviarWhatsapp(d)}
                                >
                                    Enviar mensagem
                                </button>

                                {usuario?.comercio_id === 11 && (
                                    <button
                                        className="hrs-btn-apagar"
                                        onClick={() => apagarRegistro(d.id)}
                                    >
                                        Apagar
                                    </button>
                                )}
                            </div>

                            {d.relato && (
                                <p className="hrs-det-relato">
                                    <strong>{d.relato}</strong>
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
