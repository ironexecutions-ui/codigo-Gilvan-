import React, { useEffect, useState } from "react";
import CampoEditavel from "./dados_comercias/campoeditavel";
import BlocoFlags from "./dados_comercias/blocoflags";
import BlocoModulos from "./dados_comercias/blocomodulos";
import ModalEndereco from "./dados_comercias/modalendereco";
import "./dados_comerciais.css";
import { URL } from "../../url";
import BlocoPix from "./dados_comercias/blocopix";
export default function DadosComerciais() {
    const [tiposLetra, setTiposLetra] = useState([]);

    const cliente = JSON.parse(localStorage.getItem("cliente") || "{}");
    const token = localStorage.getItem("token");

    if (
        cliente.funcao === "Funcionario(a)" ||
        cliente.funcao === "Supervisor(a)"
    ) {
        return <h2 className="dc-sem-acesso">Acesso não autorizado</h2>;
    }


    const podeEditar = cliente.funcao === "Administrador(a)";

    const [dados, setDados] = useState(null);
    const [abrirEndereco, setAbrirEndereco] = useState(false);
    useEffect(() => {
        async function carregarTipos() {
            try {
                const resp = await fetch(`${URL}/comercio/tipos-letra`);
                const json = await resp.json();
                setTiposLetra(json);
            } catch (e) {
                console.error("Erro ao carregar tipos de letra", e);
            }
        }

        carregarTipos();
    }, []);

    useEffect(() => {
        fetch(`${URL}/comercio/me`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(setDados);
    }, []);

    function salvarCampo(campo, valor) {
        fetch(`${URL}/comercio/editar-campo`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({ campo, valor })
        }).then(() => {
            setDados({ ...dados, [campo]: valor });
        });
    }

    if (!dados) {
        return (
            <div className="dc-loading-container">
                <div className="dc-loading-card">
                    <div className="dc-loading-bar" />
                    <div className="dc-loading-line" />
                    <div className="dc-loading-line" />
                    <div className="dc-loading-line small" />
                </div>
            </div>
        );
    }

    return (
        <div className="dc-container">

            {/* IDENTIDADE */}
            <section className="dc-section">
                <h2 className="dc-title">Identidade</h2>

                <CampoEditavel
                    label="Nome da loja"
                    valor={dados.loja}
                    podeEditar={podeEditar}
                    onSalvar={v => salvarCampo("loja", v)}
                />

                <CampoEditavel
                    label="Tipo de letra"
                    valor={dados.letra_tipo}
                    tipo="letra"
                    podeEditar={podeEditar}
                    opcoes={Array.isArray(tiposLetra) ? tiposLetra : []}
                    onSalvar={v => salvarCampo("letra_tipo", v)}
                />




            </section>

            {/* CONTATO */}
            <section className="dc-section">
                <h2 className="dc-title">Contato</h2>

                <CampoEditavel
                    label="Email"
                    valor={dados.email}
                    podeEditar={podeEditar}
                    onSalvar={v => salvarCampo("email", v)}
                />

                <CampoEditavel
                    label="Celular"
                    valor={dados.celular}
                    tipo="celular"
                    podeEditar={podeEditar}
                    onSalvar={v => salvarCampo("celular", v)}
                />


                <CampoEditavel
                    label="Tipo de letra"
                    valor={dados.letra_tipo}
                    tipo="letra"
                    podeEditar={podeEditar}
                    opcoes={tiposLetra}
                    onSalvar={v => salvarCampo("letra_tipo", v)}
                />

            </section>

            {/* ENDEREÇO */}
            <section className="dc-section">
                <h2 className="dc-title">Endereço</h2>

                <div className="dc-endereco-resumo">
                    {dados.rua}, {dados.numero} – {dados.bairro}, {dados.cidade}
                </div>

                {podeEditar && (
                    <button
                        className="dc-btn-secundario"
                        onClick={() => setAbrirEndereco(true)}
                    >
                        Editar endereço
                    </button>
                )}

                {abrirEndereco && (
                    <ModalEndereco
                        dados={dados}
                        fechar={() => setAbrirEndereco(false)}
                        onSalvar={novo => setDados({ ...dados, ...novo })}
                    />
                )}
            </section>

            {/* IMAGEM */}
            <section className="dc-section">
                <h2 className="dc-title">Imagem do comércio</h2>

                <div className="dc-imagem-box">
                    <img
                        src={
                            dados.imagem
                                ? `${dados.imagem}?v=${Date.now()}`
                                : ""
                        }
                        className="dc-imagem"
                        alt="Imagem do comércio"
                    />

                </div>

                {podeEditar && (
                    <input
                        className="dc-upload"
                        type="file"
                        onChange={e => {
                            const form = new FormData();
                            form.append("arquivo", e.target.files[0]);

                            fetch(`${URL}/comercio/imagem`, {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer " + token
                                },
                                body: form
                            })
                                .then(r => r.json())
                                .then(r => setDados({ ...dados, imagem: r.imagem }));
                        }}
                    />
                )}
            </section>

            {/* MÓDULOS */}
            <section className="dc-section">
                <h2 className="dc-title">Módulos</h2>
                <BlocoModulos
                    comercioId={dados.id}
                    podeEditar={podeEditar}
                />

            </section>

            {/* FLAGS */}
            <section className="dc-section">
                <h2 className="dc-title">Configurações</h2>
                <BlocoFlags
                    dados={dados}
                    podeEditar={podeEditar}
                    salvar={salvarCampo}
                />
            </section>
            <BlocoPix token={token} />

        </div>
    );
}
