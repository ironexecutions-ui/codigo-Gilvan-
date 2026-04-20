import React, { useState } from "react";
import { createPortal } from "react-dom";
import { URL } from "../../url";
import "./modaleditarcliente.css";

export default function ModalEditarCliente({ cliente, fechar, atualizar }) {
    const [form, setForm] = useState({
        email: cliente?.email || "",
        nome_completo: cliente?.nome_completo || "",
        cargo: cliente?.cargo || "",
        matricula: cliente?.matricula || ""
    });


    function alterar(campo, valor) {
        setForm({ ...form, [campo]: valor });
    }

    async function salvar() {
        const token = localStorage.getItem("token");

        const url = cliente
            ? `${URL}/controle/clientes/${cliente.id}`
            : `${URL}/controle/clientes`;

        const method = cliente ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
        });

        atualizar();
        fechar();
    }
    async function apagar() {
        if (!cliente) return;

        const confirmar = window.confirm(
            "Tem certeza que deseja apagar este usuário? Essa ação não pode ser desfeita."
        );

        if (!confirmar) return;

        const token = localStorage.getItem("token");

        await fetch(`${URL}/controle/clientes/${cliente.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        atualizar();
        fechar();
    }

    async function baixar(tipo) {
        const token = localStorage.getItem("token");

        const resp = await fetch(
            `${URL}/controle/clientes/${cliente.id}/pdf/${tipo}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resp.ok) {
            alert("Erro ao gerar PDF");
            return;
        }

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = tipo === "codigo"
            ? "codigo_barras.pdf"
            : "qr_code.pdf";

        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
    }


    return createPortal(
        <div className="mee-overlay">
            <div className="me-modal">

                <h3>{cliente ? "Editar cliente" : "Adicionar cliente"}</h3>

                {cliente && (
                    <div className="me-botoes-pdf">
                        <button onClick={() => baixar("codigo")}>
                            Baixar código de barras
                        </button>

                        <button onClick={() => baixar("qrcode")}>
                            Baixar QR Code
                        </button>
                    </div>
                )}


                <input
                    value={form.email}
                    onChange={e => alterar("email", e.target.value)}
                    placeholder="Email"
                />

                <input
                    value={form.nome_completo}
                    onChange={e => alterar("nome_completo", e.target.value)}
                    placeholder="Nome completo"
                />

                <input
                    value={form.cargo}
                    onChange={e => alterar("cargo", e.target.value)}
                    placeholder="Cargo"
                />

                <input
                    value={form.matricula}
                    onChange={e => alterar("matricula", e.target.value)}
                    placeholder="Matrícula"
                />

                <div className="me-acoes">
                    <button onClick={fechar}>Cancelar</button>

                    {cliente && (
                        <button onClick={apagar} className="apagar">
                            Apagar
                        </button>
                    )}

                    <button onClick={salvar} className="salvar">
                        Salvar
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}
