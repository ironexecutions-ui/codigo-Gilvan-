import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config";
import "./proximos.css";

export default function Proximos() {

    const [dados, setDados] = useState([]);
    const navigate = useNavigate(); // ✅ necessário

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const r = await fetch(`${API_URL}/pagos/proximos`);
        const data = await r.json();
        setDados(data);
    }

    function diasRestantes(data) {
        const hoje = new Date();
        const futuro = new Date(data);

        // 🔥 remove hora para não dar erro de cálculo
        hoje.setHours(0, 0, 0, 0);
        futuro.setHours(0, 0, 0, 0);

        const diff = futuro - hoje;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="proximos_container">

            {dados.map(p => {
                const dias = diasRestantes(p.data_pagamento);

                let classe = "proximos_dias";

                if (dias < 0) classe += " proximos_atrasado";
                else if (dias === 0) classe += " proximos_hoje";

                return (
                    <div key={p.id} className="proximos_card">

                        <h3>{p.nome_aluno}</h3>

                        <p>
                            Data: {
                                new Date(p.data_pagamento)
                                    .toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric"
                                    })
                                    .toLowerCase()
                            }
                        </p>

                        <span
                            className={classe}
                            onClick={() => navigate(`/pagos/${p.id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            {dias < 0
                                ? `Atrasado ${Math.abs(dias)} dias`
                                : dias === 0
                                    ? "Paga hoje"
                                    : `Faltam ${dias} dias`}
                        </span>

                    </div>
                );
            })}

        </div>
    );
}