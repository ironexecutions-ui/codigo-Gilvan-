import React, { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import "./servicosadminib.css";

export default function ServicosAdminIB() {

    const [modo, setModo] = useState("lista");
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregar();
    }, [modo]);

    async function carregar() {
        setCarregando(true);

        const rota =
            modo === "lista"
                ? "/admin/servicos/unificado"
                : "/admin/servicos/totais-mensais";

        const resp = await fetch(`${API_URL}${rota}`);

        const json = await resp.json();
        setDados(json);
        setCarregando(false);
    }

    function corLinha(origem) {
        if (origem === "servicos_ib") return "linha-ib";
        if (origem === "servicos") return "linha-sistemas";
        return "linha-pagamentos";
    }

    return (
        <div className="sib-container">

            <div className="sib-topo">
                <button
                    onClick={() => setModo("lista")}
                    className={modo === "lista" ? "ativo" : ""}
                >
                    Lista geral
                </button>

                <button
                    onClick={() => setModo("totais")}
                    className={modo === "totais" ? "ativo" : ""}
                >
                    Totais por mês
                </button>
            </div>

            {carregando && <p>Carregando...</p>}

            {!carregando && modo === "lista" && (
                <table className="sib-tabela">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Loja</th>
                            <th>Data</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.map((d, i) => (
                            <tr key={i} className={corLinha(d.origem)}>
                                <td>{d.tipo_nome}</td>
                                <td>{d.loja}</td>
                                <td>{d.data}</td>
                                <td>
                                    {d.origem === "servicos" && d.processo !== "finalizado"
                                        ? d.processo
                                        : `R$ ${Number(d.valor).toFixed(2)}`
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!carregando && modo === "totais" && (
                <table className="sib-tabela">
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th>Total líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.map((d, i) => (
                            <tr key={i}>
                                <td>{d.mes}</td>
                                <td>
                                    R$ {Number(d.total_liquido || 0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

        </div>
    );
}
