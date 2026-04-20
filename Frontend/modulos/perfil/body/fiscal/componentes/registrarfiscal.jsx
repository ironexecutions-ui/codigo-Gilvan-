import React, { useEffect, useState } from "react";
import FormularioFiscal from "./formulariofiscal";
import { API_URL } from "../../../../../config";
import "./registrarfiscal.css";

export default function RegistrarFiscal() {

    const [tipo, setTipo] = useState("produto");
    const [lista, setLista] = useState([]);
    const [selecionado, setSelecionado] = useState(null);
    const [funcao, setFuncao] = useState(null);
    const [bloqueado, setBloqueado] = useState(false);

    const token = localStorage.getItem("token");

    // ===============================
    // VERIFICAR FUNÇÃO DO USUÁRIO
    // ===============================
    useEffect(() => {
        fetch(`${API_URL}/clientes/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(dados => {
                if (
                    dados.funcao !== "Administrador(a)"
                ) {
                    setBloqueado(true);
                } else {
                    setFuncao(dados.funcao);
                }
            })
            .catch(() => setBloqueado(true));
    }, []);

    // ===============================
    // CARREGAR PRODUTOS
    // ===============================
    useEffect(() => {
        if (!funcao) return;

        fetch(`${API_URL}/fiscal/produtos-servicos`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setLista);
    }, [funcao]);

    if (bloqueado) {
        return (
            <div className="registrar-fiscal-bloqueado">
                <h4>Acesso restrito</h4>
                <p>Somente administradores podem registrar dados fiscais.</p>
            </div>
        );
    }

    if (!funcao) {
        return <p>Carregando...</p>;
    }

    const filtrados = lista.filter(p => {
        if (tipo === "servico") return p.tempo_servico;
        return p.unidade || p.unidades;
    });

    return (
        <div className="registrar-fiscal">

            <h4>Registrar Dados Fiscais</h4>

            <div className="registrar-fiscal-topo">
                <select
                    value={tipo}
                    onChange={e => {
                        setTipo(e.target.value);
                        setSelecionado(null);
                    }}
                >
                    <option value="produto">Produto</option>
                    <option value="servico">Serviço</option>
                </select>

                <input
                    list="produtos"
                    placeholder="Escolha o item"
                    onChange={e => {
                        const item = filtrados.find(
                            i => i.id === Number(e.target.value)
                        );
                        setSelecionado(item);
                    }}
                />
            </div>

            <datalist id="produtos">
                {filtrados.map(p => (
                    <option
                        key={p.id}
                        value={p.id}
                        label={`${p.nome} | ${p.unidade || ""} ${p.unidades || ""} ${p.tempo_servico || ""}`}
                    />
                ))}
            </datalist>

            {selecionado && (
                <div className="registrar-fiscal-form">
                    <FormularioFiscal tipo={tipo} produto={selecionado} />
                </div>
            )}

        </div>
    );
}
