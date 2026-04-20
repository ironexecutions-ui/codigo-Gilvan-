import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import "./infos.css";

export default function Infos() {

    const [hora, setHora] = useState(new Date());
    const [nome, setNome] = useState("Carregando...");
    const [funcao, setFuncao] = useState("");

    /* ===============================
       BUSCAR USUÁRIO LOGADO
    =============================== */
    useEffect(() => {
        const token = localStorage.getItem("token");

        async function carregarUsuario() {
            try {
                const resp = await fetch(`${API_URL}/retorno/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!resp.ok) {
                    setNome("Não identificado");
                    return;
                }

                const data = await resp.json();
                setNome(data.nome);
                setFuncao(data.funcao);
            } catch {
                setNome("Não identificado");
            }
        }

        carregarUsuario();
    }, []);

    /* ===============================
       RELÓGIO EM TEMPO REAL
    =============================== */
    useEffect(() => {
        const timer = setInterval(() => {
            setHora(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="infos-container">
            <div className="infos-linha">
                <span className="infos-label">Funcionário: </span>
                <strong>{nome}</strong>
            </div>



            <div className="infos-linha infos-datahora">
                <strong className="infos-data">
                    {hora.toLocaleDateString("pt-BR")}
                </strong>
                <span className="infos-separador">•</span>
                <strong className="infos-hora">
                    {hora.toLocaleTimeString("pt-BR")}
                </strong>
            </div>

        </div>
    );
}
