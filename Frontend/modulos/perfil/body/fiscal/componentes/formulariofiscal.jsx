import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import "./formulariofiscal.css";

export default function FormularioFiscal({ tipo, produto, modo = "novo", onSalvo }) {

    const token = localStorage.getItem("token");
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState("");

    const [form, setForm] = useState({
        produto_id: produto.id,
        ncm: "",
        cfop: "",
        origem: "",
        cst_csosn: "",
        icms: "",
        pis: "",
        cofins: "",
        cest: "",
        codigo_servico: "",
        aliquota_iss: "",
        municipio: ""
    });

    const [sugestoes, setSugestoes] = useState({
        cfop: [],
        cst_csosn: [],
        origem: [],
        cest: [],
        codigo_servico: [],
        municipio: []
    });

    const sufixo = produto.id;

    /* ===============================
       CARREGAR DADOS PARA EDIÇÃO
    =============================== */
    useEffect(() => {
        if (modo !== "editar") return;

        fetch(`${API_URL}/fiscal/dados/${produto.produto_id || produto.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(dados => {
                setForm({
                    ...dados,
                    produto_id: produto.produto_id || produto.id
                });
            });
    }, [modo, produto, token]);

    /* ===============================
       LISTAS PADRÃO (LEGAIS)
    =============================== */
    const CFOPS_PADRAO = ["5102", "5405", "6102", "6108"];

    const CST_CSOSN_PADRAO = [
        "101", "102", "103", "300", "400", "500", "900",
        "00", "20", "40", "41", "60", "90"
    ];

    const ORIGEM_PADRAO = [
        { valor: "0", label: "0 - Nacional" },
        { valor: "1", label: "1 - Importado direto" },
        { valor: "2", label: "2 - Importado mercado interno" }
    ];

    /* ===============================
       BUSCAR SUGESTÕES DO BANCO
    =============================== */
    useEffect(() => {
        const campos = [
            "cfop",
            "cst_csosn",
            "origem",
            "cest",
            "codigo_servico",
            "municipio"
        ];

        campos.forEach(campo => {
            fetch(`${API_URL}/fiscal/sugestoes/${campo}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(dados => {
                    setSugestoes(s => ({
                        ...s,
                        [campo]: dados.map(i => i[campo])
                    }));
                })
                .catch(() => { });
        });
    }, [token]);

    /* ===============================
       ENVIAR
    =============================== */
    async function enviar() {
        setSalvando(true);
        setMensagem("");

        const url =
            modo === "editar"
                ? `${API_URL}/fiscal/atualizar/${produto.produto_id || produto.id}`
                : `${API_URL}/fiscal/registrar`;

        const method = modo === "editar" ? "PUT" : "POST";

        const dadosLimpos = normalizarFormulario({
            ...form,
            tipo
        });

        try {
            const resp = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dadosLimpos)
            });

            const json = await resp.json();
            if (!resp.ok) throw new Error(json.detail);

            setMensagem("Dados fiscais salvos com sucesso");
            if (onSalvo) onSalvo();

        } catch (e) {
            setMensagem(e.message);
        } finally {
            setSalvando(false);
        }
    }


    function normalizarFormulario(form) {
        const copia = { ...form };

        Object.keys(copia).forEach(k => {
            if (copia[k] === "") {
                copia[k] = null;
            }
            if (Number.isNaN(copia[k])) {
                copia[k] = null;
            }
        });

        return copia;
    }

    return (
        <div className="formulario-fiscal">

            <h5>{produto.nome}</h5>

            {/* ===============================
               PRODUTO
            =============================== */}
            {tipo === "produto" && (
                <div className="formulario-fiscal-bloco">

                    <input
                        placeholder="NCM"
                        value={form.ncm || ""}
                        onChange={e => setForm({ ...form, ncm: e.target.value })}
                    />

                    <input
                        list={`cfop-${sufixo}`}
                        placeholder="CFOP"
                        value={form.cfop || ""}
                        onChange={e => setForm({ ...form, cfop: e.target.value })}
                    />
                    <datalist id={`cfop-${sufixo}`}>
                        {CFOPS_PADRAO.map(v => (
                            <option key={v} value={v} />
                        ))}
                        {sugestoes.cfop.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    <input
                        list={`origem-${sufixo}`}
                        placeholder="Origem do produto"
                        value={form.origem || ""}
                        onChange={e => setForm({ ...form, origem: e.target.value })}
                    />
                    <datalist id={`origem-${sufixo}`}>
                        {ORIGEM_PADRAO.map(o => (
                            <option key={o.valor} value={o.valor} label={o.label} />
                        ))}
                        {sugestoes.origem.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    <input
                        list={`cst-${sufixo}`}
                        placeholder="CST ou CSOSN"
                        value={form.cst_csosn || ""}
                        onChange={e => setForm({ ...form, cst_csosn: e.target.value })}
                    />
                    <datalist id={`cst-${sufixo}`}>
                        {CST_CSOSN_PADRAO.map(v => (
                            <option key={v} value={v} />
                        ))}
                        {sugestoes.cst_csosn.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    <input
                        placeholder="ICMS (%)"
                        type="number"
                        step="0.01"
                        value={form.icms === 0 ? 0 : form.icms || ""}
                        onChange={e => setForm({ ...form, icms: Number(e.target.value) })}
                    />

                    <input
                        placeholder="PIS (%)"
                        type="number"
                        step="0.01"
                        value={form.pis === 0 ? 0 : form.pis || ""}
                        onChange={e => setForm({ ...form, pis: Number(e.target.value) })}
                    />

                    <input
                        placeholder="COFINS (%)"
                        type="number"
                        step="0.01"
                        value={form.cofins === 0 ? 0 : form.cofins || ""}
                        onChange={e => setForm({ ...form, cofins: Number(e.target.value) })}
                    />

                    <input
                        list={`cest-${sufixo}`}
                        placeholder="CEST (se aplicável)"
                        value={form.cest || ""}
                        onChange={e => setForm({ ...form, cest: e.target.value })}
                    />
                    <datalist id={`cest-${sufixo}`}>
                        {sugestoes.cest.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                </div>
            )}

            {/* ===============================
               SERVIÇO
            =============================== */}
            {tipo === "servico" && (
                <div className="formulario-fiscal-bloco">

                    <input
                        list={`codigo_servico-${sufixo}`}
                        placeholder="Código do serviço (LC 116)"
                        value={form.codigo_servico || ""}
                        onChange={e => setForm({ ...form, codigo_servico: e.target.value })}
                    />
                    <datalist id={`codigo_servico-${sufixo}`}>
                        {sugestoes.codigo_servico.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                    <input
                        placeholder="Alíquota ISS (%)"
                        type="number"
                        step="0.01"
                        value={form.aliquota_iss === 0 ? 0 : form.aliquota_iss || ""}
                        onChange={e => setForm({ ...form, aliquota_iss: Number(e.target.value) })}
                    />

                    <input
                        list={`municipio-${sufixo}`}
                        placeholder="Município"
                        value={form.municipio || ""}
                        onChange={e => setForm({ ...form, municipio: e.target.value })}
                    />
                    <datalist id={`municipio-${sufixo}`}>
                        {sugestoes.municipio.map(v => (
                            <option key={v} value={v} />
                        ))}
                    </datalist>

                </div>
            )}

            {mensagem && (
                <div className="formulario-fiscal-mensagem">
                    {mensagem}
                </div>
            )}

            <button onClick={enviar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar dados fiscais"}
            </button>

        </div>
    );
}
