import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../config";
import HorasDetalhes from "./components/horasdetalhes";
import HorasForm from "./components/horasform";
import "./horas.css";

export default function Horas() {
    const [semanas, setSemanas] = useState([]);
    const [selecionada, setSelecionada] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [saldo, setSaldo] = useState(null);
    const [detalhesCarregados, setDetalhesCarregados] = useState(false);

    const detalhesRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        fetch(`${API_URL}/retorno/me`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(setUsuario);

        fetch(`${API_URL}/horas/semanas`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(setSemanas);

        fetch(`${API_URL}/horas/saldo-atual`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(setSaldo);
    }, []);

    // 🔥 SCROLL SÓ DEPOIS QUE OS DETALHES CARREGAREM
    useEffect(() => {
        if (detalhesCarregados && detalhesRef.current) {
            detalhesRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [detalhesCarregados]);

    if (!usuario || !saldo) return null;

    if (![11, 25, 28].includes(usuario.comercio_id)) {
        window.location.href = "/";
        return null;
    }

    function abrirDetalhes(semanaInicio) {
        setDetalhesCarregados(false);
        setSelecionada(semanaInicio);
    }
    // Próxima semana: nunca passa de 40
    const proximaSemanaExibida = Math.min(saldo.saldo_proxima_semana, 40);

    // Semana atual com lógica dinâmica
    let semanaAtualExibida = saldo.saldo_semana_atual;

    if (saldo.saldo_semana_atual > 40) {
        semanaAtualExibida = 40 - (saldo.saldo_semana_atual - 40);
    }

    return (
        <div className="hrs-page">
            <div className="hrs-card">
                <h2 className="hrs-title">Controle de Horas</h2>

                <div className="hrs-saldo-box">
                    <span className="hrs-saldo-label">Saldo de horas</span>

                    <div className="hrs-saldo-linhas">
                        <div className="hrs-saldo-item">
                            <span className="hrs-saldo-titulo">Semana atual</span>
                            <span className="hrs-saldo-valor">
                                {semanaAtualExibida}h
                            </span>
                        </div>


                        <div className="hrs-saldo-item">
                            <span className="hrs-saldo-titulo">Próxima semana</span>
                            <span className="hrs-saldo-valor">
                                {proximaSemanaExibida}h
                            </span>
                        </div>

                    </div>
                </div>

                <div className="hrs-table-wrapper">
                    <table className="hrs-table">
                        <thead className="hrs-table-head">
                            <tr className="hrs-table-row-head">
                                <th className="hrs-th">Semana</th>
                                <th className="hrs-th">Horas usadas</th>
                                <th className="hrs-th">ver detalhes</th>
                            </tr>
                        </thead>

                        <tbody className="hrs-table-body">
                            {semanas.map(s => (
                                <tr className="hrs-table-row" key={s.semana_inicio}>
                                    <td className="hrs-td">
                                        {s.semana_inicio} até {s.semana_fim}
                                    </td>

                                    <td className="hrs-td">{s.total_horas}h</td>

                                    <td className="hrs-td">
                                        <button
                                            className="hrs-btn hrs-btn-detalhes"
                                            onClick={() => abrirDetalhes(s.semana_inicio)}
                                        >
                                            Ver detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {usuario.comercio_id === 11 && (
                    <div className="hrs-form-wrapper">
                        <HorasForm />
                    </div>
                )}

                {selecionada && (
                    <div ref={detalhesRef} className="hrs-detalhes-wrapper">
                        <HorasDetalhes
                            semanaInicio={selecionada}
                            onLoaded={() => setDetalhesCarregados(true)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
