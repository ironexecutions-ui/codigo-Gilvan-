import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../../../../../config";
import "./modalsempreco.css";

export default function ModalProdutosSemPreco({ fechar, atualizar }) {

    const [lista, setLista] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetch(`${API_URL}/admin/analise/produtos-sem-preco`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setLista);
    }, []);

    async function salvar(p) {
        await fetch(
            `${API_URL}/admin/analise/produto-preco/${p.id}?preco=${p.preco}&preco_recebido=${p.preco_recebido}`,
            {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        atualizar();
        fechar();
    }

    return createPortal(
        <div className="modal-bg">
            <div className="modal-caixa">
                <h4>Produtos sem valor definido</h4>

                {lista.map(p => (
                    <div key={p.id} className="modal-item">
                        <strong>{p.nome}</strong>

                        <input
                            type="number"
                            placeholder="Custo"
                            value={p.preco}
                            onChange={e =>
                                setLista(lista.map(i =>
                                    i.id === p.id ? { ...i, preco: e.target.value } : i
                                ))
                            }
                        />

                        <input
                            type="number"
                            placeholder="Venda"
                            value={p.preco_recebido}
                            onChange={e =>
                                setLista(lista.map(i =>
                                    i.id === p.id ? { ...i, preco_recebido: e.target.value } : i
                                ))
                            }
                        />

                        <button onClick={() => salvar(p)}>Salvar</button>
                    </div>
                ))}

                <button className="fechar" onClick={fechar}>Fechar</button>
            </div>
        </div>,
        document.body
    );
}
