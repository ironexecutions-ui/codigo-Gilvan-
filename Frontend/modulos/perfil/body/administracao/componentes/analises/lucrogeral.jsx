import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../../config";
import "./lucrogeral.css";
import ModalProdutosSemPreco from "./modalsempreco";

export default function LucroGeral() {
    const [abrirModal, setAbrirModal] = useState(false);
    const [dados, setDados] = useState(null);
    const [limite, setLimite] = useState(5);

    const [categoria, setCategoria] = useState("");
    const [nome, setNome] = useState("");
    const [categorias, setCategorias] = useState([]);

    const token = localStorage.getItem("token");

    function carregar() {
        const params = new URLSearchParams();
        params.append("limite", limite);

        if (categoria) params.append("categoria", categoria);
        if (nome) params.append("nome", nome);

        fetch(`${API_URL}/admin/analise/margem-produtos?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setDados);
    }

    function carregarCategorias() {
        fetch(`${API_URL}/admin/analise/categorias`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setCategorias);
    }

    useEffect(() => {
        carregarCategorias();
    }, []);

    useEffect(() => {
        carregar();
    }, [limite, categoria, nome]);

    if (!dados) return <p>Carregando análise...</p>;

    return (
        <div className="lucro-geral-container">

            <h4>Análise de Precificação</h4>

            {dados.invalidos_total > 0 && (
                <div
                    className="lucro-alerta"
                    onClick={() => setAbrirModal(true)}
                >
                    ⚠ Existem {dados.invalidos_total} produtos sem valor definido
                </div>
            )}

            <div className="lucro-card">
                <span>Markup médio sobre custo</span>
                <strong>{dados.percentual_medio}%</strong>
            </div>

            <div className="lucro-geral-filtros">

                <div>
                    <label>Categoria</label>
                    <input
                        list="categorias"
                        value={categoria}
                        onChange={e => setCategoria(e.target.value)}
                        placeholder="Todas"
                    />
                    <datalist id="categorias">
                        {categorias.map((c, i) => (
                            <option key={i} value={c} />
                        ))}
                    </datalist>
                </div>

                <div>
                    <label>Nome do produto</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Buscar por nome"
                    />
                </div>

                <div>
                    <label>Quantidade no ranking</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={limite}
                        onChange={e => {
                            let valor = Number(e.target.value);
                            if (valor < 1) valor = 1;
                            if (valor > 50) valor = 50;
                            setLimite(valor);
                        }}
                    />
                </div>

            </div>

            <div className="lucro-ranking">

                <div className="lucro-ranking-bloco">
                    <h5>Maiores markups</h5>
                    {dados.maiores.map((p, i) => (
                        <div key={i} className="lucro-item maior">
                            {p.nome} <span>{p.percentual}%</span>
                        </div>
                    ))}
                </div>

                <div className="lucro-ranking-bloco">
                    <h5>Menores markups</h5>
                    {dados.menores.map((p, i) => (
                        <div key={i} className="lucro-item menor">
                            {p.nome} <span>{p.percentual}%</span>
                        </div>
                    ))}
                </div>

            </div>

            {abrirModal && (
                <ModalProdutosSemPreco
                    fechar={() => setAbrirModal(false)}
                    atualizar={carregar}
                />
            )}

        </div>
    );
}
