import React, { useState } from "react";
import { URL } from "../../../url";
import "./modalendereco.css";

export default function ModalEndereco({ dados, fechar, onSalvar }) {

    const token = localStorage.getItem("token");

    const [form, setForm] = useState({
        cep: dados.cep,
        rua: dados.rua,
        bairro: dados.bairro,
        numero: dados.numero,
        cidade: dados.cidade,
        estado: dados.estado
    });

    function salvar() {
        fetch(`${URL}/comercio/endereco`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify(form)
        }).then(() => {
            onSalvar(form);
            fechar();
        });
    }

    return (
        <div className="me-overlay">
            <div className="me-modal">

                <h3 className="me-title">Editar endereço</h3>

                <div className="me-form">
                    {Object.keys(form).map(campo => (
                        <div key={campo} className="me-campo">
                            <label className="me-label">
                                {campo.charAt(0).toUpperCase() + campo.slice(1)}
                            </label>

                            <input
                                className="me-input"
                                value={form[campo] || ""}
                                onChange={e =>
                                    setForm({ ...form, [campo]: e.target.value })
                                }
                            />
                        </div>
                    ))}
                </div>

                <div className="me-acoes">
                    <button className="me-btn me-btn-primario" onClick={salvar}>
                        Salvar
                    </button>

                    <button className="me-btn me-btn-secundario" onClick={fechar}>
                        Cancelar
                    </button>
                </div>

            </div>
        </div>
    );
}
