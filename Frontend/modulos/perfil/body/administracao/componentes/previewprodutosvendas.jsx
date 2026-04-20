import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../../../../config";
import "./previewprodutosvendas.css";

export default function PreviewProdutosVenda({ venda }) {

    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        if (venda) carregarProdutos();
        else setProdutos([]);
    }, [venda]);

    async function carregarProdutos() {
        if (!venda?.produtos) return;

        const itens = venda.produtos.split(",").map(p => {
            const [id, qtd] = p.split(":");
            return { id, qtd };
        });

        const token = localStorage.getItem("token");

        const resp = await fetch(`${API_URL}/admin/vendas/produtos/ids`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ids: itens.map(i => i.id) })
        });

        const dados = await resp.json();

        const combinados = itens.map(i => {
            const p = dados.find(d => d.id == i.id);
            return {
                nome: p?.nome || "Produto removido",
                unidade: p?.unidade || "",
                imagem: p?.imagem_url?.split("|")[0] || null,
                qtd: i.qtd
            };
        });

        setProdutos(combinados);
    }

    return createPortal(
        <div className="ppv-container" tabIndex={0}>

            {!venda && (
                <div className="ppv-vazio">
                    Passe o mouse em uma venda
                </div>
            )}

            {venda && (
                <>
                    <h5>Produtos da venda</h5>

                    {produtos.map((p, i) => (
                        <div key={i} className="ppv-item">
                            {p.imagem && <img src={p.imagem} alt={p.nome} />}
                            <div>
                                <strong>{p.nome}</strong>
                                <span>
                                    <strong>{p.unidade}</strong> Quantidade: {p.qtd}
                                </span>
                            </div>
                        </div>
                    ))}
                </>
            )}

        </div>,
        document.body
    );

}
