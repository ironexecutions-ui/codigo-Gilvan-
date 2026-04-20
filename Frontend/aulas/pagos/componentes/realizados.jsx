import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "./realizados.css"
export default function PagosRealizados() {

    const [dados, setDados] = useState([]);

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        const r = await fetch(`${API_URL}/pagos/realizados`);
        const data = await r.json();
        setDados(data);
    }

    return (
        <div className="realizados_container">

            {dados.map(p => (
                <div key={p.id} className="realizados_card">

                    <h3>{p.nome_aluno}</h3>

                    <p>Valor: R$ {p.quanto}</p>

                    <p>
                        Pago em: {
                            new Date(p.data_pagamento)
                                .toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                })
                                .toLowerCase()
                        }
                    </p>
                    <span className="realizados_badge">
                        Pago
                    </span>

                </div>
            ))}

        </div>
    );
}