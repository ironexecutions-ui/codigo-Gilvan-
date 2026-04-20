import React, { useState } from "react";
import "./campoeditavel.css";

export default function CampoEditavel({
    label,
    valor,
    podeEditar,
    onSalvar,
    tipo = "text",
    opcoes = []
}) {

    function formatarCNPJ(v) {
        if (!v) return "";

        const numeros = v.replace(/\D/g, "").slice(0, 14);

        return numeros
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    function formatarCelular(v) {
        if (!v) return "";

        const numeros = v.replace(/\D/g, "").slice(0, 11);

        if (numeros.length <= 10) {
            return numeros
                .replace(/^(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d)/, "$1-$2");
        }

        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    const [editando, setEditando] = useState(false);
    const [novoValor, setNovoValor] = useState("");

    function iniciarEdicao() {
        if (!podeEditar) return;

        if (tipo === "cnpj") {
            setNovoValor(formatarCNPJ(valor || ""));
        } else if (tipo === "celular") {
            setNovoValor(formatarCelular(valor || ""));
        } else {
            setNovoValor(valor || "");
        }

        setEditando(true);
    }

    function salvar() {
        onSalvar(novoValor);
        setEditando(false);
    }

    return (
        <div className="ce-container">

            <span className="ce-label">{label}</span>

            {editando ? (
                <div className="ce-edicao">

                    {/* SELECT PARA TIPO DE LETRA */}
                    {tipo === "letra" ? (
                        <select
                            className="ce-input"
                            value={novoValor}
                            onChange={e => setNovoValor(e.target.value)}
                            autoFocus
                        >
                            <option value="">Selecione</option>

                            {opcoes.map(opcao => (
                                <option key={opcao} value={opcao}>
                                    {opcao}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="ce-input"
                            value={novoValor}
                            onChange={e => {
                                const v = e.target.value;

                                if (tipo === "cnpj") {
                                    setNovoValor(formatarCNPJ(v));
                                    return;
                                }

                                if (tipo === "celular") {
                                    setNovoValor(formatarCelular(v));
                                    return;
                                }

                                setNovoValor(v);
                            }}
                            autoFocus
                        />
                    )}

                    <div className="ce-botoes">
                        <button
                            className="ce-btn ce-btn-salvar"
                            onClick={salvar}
                        >
                            Salvar
                        </button>

                        <button
                            className="ce-btn ce-btn-cancelar"
                            onClick={() => setEditando(false)}
                        >
                            Cancelar
                        </button>
                    </div>

                </div>
            ) : (
                <span
                    className={`ce-valor ${podeEditar ? "ce-editavel" : ""}`}
                    onClick={iniciarEdicao}
                >
                    {tipo === "cnpj"
                        ? formatarCNPJ(valor)
                        : tipo === "celular"
                            ? formatarCelular(valor)
                            : (valor || "—")}
                </span>
            )}

        </div>
    );
}
