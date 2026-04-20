import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../../config";

export default function LucroPorMes() {

    const [dados, setDados] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetch(`${API_URL}/admin/analise/lucro-mes`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setDados);
    }, []);

    return (
        <div>
            <h4>Lucro por Mês</h4>

            {dados.map(item => (
                <p key={item.mes}>
                    {item.mes} | R$ {item.lucro}
                </p>
            ))}
        </div>
    );
}
