import React, { useEffect, useState } from "react";
import FormularioFiscal from "./formulariofiscal";
import { API_URL } from "../../../../../config";
import "./registradosfiscal.css";

export default function RegistradosFiscal() {

    const [tipo, setTipo] = useState("produto");
    const [lista, setLista] = useState([]);
    const [editando, setEditando] = useState(null);

    const [filtroNome, setFiltroNome] = useState("");
    const [filtroCodigo, setFiltroCodigo] = useState("");

    const token = localStorage.getItem("token");

    function carregar() {
        fetch(`${API_URL}/fiscal/registrados?tipo=${tipo}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setLista);
    }

    useEffect(() => {
        carregar();
        setEditando(null);
        setFiltroNome("");
        setFiltroCodigo("");
    }, [tipo]);

    function textoUnidade(item) {
        if (item.unidade) return item.unidade;
        if (item.unidades) return `${item.unidades} unidades`;
        if (item.tempo_servico) return item.tempo_servico;
        return "-";
    }

    const listaFiltrada = lista.filter(item => {
        const nomeOk = item.nome
            ?.toLowerCase()
            .includes(filtroNome.toLowerCase());

        const codigoOk = item.codigo_barras
            ? item.codigo_barras.includes(filtroCodigo)
            : filtroCodigo === "";

        return nomeOk && codigoOk;
    });

    return (
        <div className="registrados-fiscal">

            <h4>Dados Fiscais Registrados</h4>

            <div className="registrados-fiscal-filtros">

                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="produto">Produtos</option>
                    <option value="servico">Serviços</option>
                </select>

                <input
                    placeholder="Filtrar por nome"
                    value={filtroNome}
                    onChange={e => setFiltroNome(e.target.value)}
                />

                <input
                    placeholder="Filtrar por código de barras"
                    value={filtroCodigo}
                    onChange={e => setFiltroCodigo(e.target.value)}
                />

            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Unidade</th>
                        <th>CFOP</th>
                        <th>CST</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {listaFiltrada.map(item => (
                        <tr key={item.fiscal_id}>
                            <td>{item.nome}</td>
                            <td>{textoUnidade(item)}</td>
                            <td>{item.cfop || "-"}</td>
                            <td>{item.cst_csosn || "-"}</td>
                            <td>
                                <button onClick={() => setEditando(item)}>
                                    Editar
                                </button>
                            </td>
                        </tr>
                    ))}

                    {listaFiltrada.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ opacity: 0.6 }}>
                                Nenhum registro encontrado
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {editando && (
                <FormularioFiscal
                    tipo={tipo}
                    produto={editando}
                    modo="editar"
                    onSalvo={() => {
                        setEditando(null);
                        carregar();
                    }}
                />
            )}

        </div>
    );
}
