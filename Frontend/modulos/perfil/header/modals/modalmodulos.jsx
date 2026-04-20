import React, { useEffect, useState } from "react";
import "./modalmodulos.css";
import { API_URL } from "../../../../config";

export default function ModalModulos({ dados, fechar }) {

    const [modulosComercio, setModulosComercio] = useState([]);
    const [modulosAtivosSistema, setModulosAtivosSistema] = useState([]);
    const [modulosDisponiveis, setModulosDisponiveis] = useState([]);

    function normalizar(texto) {
        return texto.toLowerCase().trim();
    }

    useEffect(() => {
        async function carregar() {

            const token = localStorage.getItem("token");

            if (!token) {
                alert("Token não encontrado");
                fechar();
                return;
            }

            // módulos que o comércio já tem
            const resp1 = await fetch(
                `${API_URL}/modulos/empresa/${dados.comercio_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!resp1.ok) {
                alert("Acesso não autorizado");
                fechar();
                return;
            }

            const listaComercio = await resp1.json();
            setModulosComercio(listaComercio);

            // módulos ativos no sistema
            const resp2 = await fetch(
                `${API_URL}/modulos/ativos`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!resp2.ok) {
                alert("Acesso não autorizado");
                fechar();
                return;
            }

            const listaAtivos = await resp2.json();
            setModulosAtivosSistema(listaAtivos);

            const usados = listaComercio.map(m => normalizar(m.modulo));

            const livres = listaAtivos
                .map(m => m.modulo)
                .filter(nome => !usados.includes(normalizar(nome)));

            setModulosDisponiveis(livres);
        }

        carregar();
    }, []);

    function renderStatus(ativo) {
        return ativo === 1 ? "Ativo" : "Solicitado";
    }

    async function solicitarModulo(nomeModulo) {

        const token = localStorage.getItem("token");

        const resp = await fetch(`${API_URL}/modulos/solicitar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                comercio_id: dados.comercio_id,
                modulo: nomeModulo
            })
        });

        if (!resp.ok) {
            alert("Acesso não autorizado");
            return;
        }

        setModulosComercio(prev => [
            ...prev,
            { modulo: nomeModulo, ativo: 0, descricao: "" }
        ]);

        setModulosDisponiveis(prev => prev.filter(n => n !== nomeModulo));
    }

    return (
        <div className="qr-modal-fundo modal-global">
            <div className="qr-modal-caixa">

                <h2 className="qr-titulo">Módulos do Comércio</h2>

                <h3 className="qr-subtitulo">Ativos e Solicitados</h3>

                <ul className="qr-lista-modulos">
                    {modulosComercio.map((m, index) => (
                        <li
                            key={index}
                            className="qr-item-modulo"
                            title={m.descricao || ""}
                        >
                            <span className="qr-nome-modulo">{m.modulo}</span>

                            <span
                                className={`qr-status ${m.ativo === 1
                                    ? "qr-status-ativo"
                                    : "qr-status-solicitado"
                                    }`}
                            >
                                {renderStatus(m.ativo)}
                            </span>
                        </li>
                    ))}
                </ul>

                <h3 className="qr-subtitulo">Disponíveis para Solicitar</h3>

                {modulosDisponiveis.length === 0 ? (
                    <p className="qr-sem-modulos">Nenhum módulo disponível</p>
                ) : (
                    <ul className="qr-lista-modulos">
                        {modulosDisponiveis.map((nome, index) => (
                            <li key={index} className="qr-item-modulo">
                                <span className="qr-nome-modulo">{nome}</span>

                                <button
                                    className="qr-btn-solicitar"
                                    onClick={() => solicitarModulo(nome)}
                                >
                                    Solicitar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <button className="qr-btn-fechar" onClick={fechar}>
                    Fechar
                </button>

            </div>
        </div>
    );
}
