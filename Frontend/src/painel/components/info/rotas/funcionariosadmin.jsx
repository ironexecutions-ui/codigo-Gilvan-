import React, { useEffect, useState } from "react";
import "./funcionariosadmin.css";
import { API_URL } from "../../config";

export default function FuncionariosAdmin() {

    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormularioMobile, setMostrarFormularioMobile] = useState(false);

    const [modoEdicao, setModoEdicao] = useState(false);
    const [itemEditando, setItemEditando] = useState(null);

    const [nome, setNome] = useState("");
    const [sobrenome, setSobrenome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [funcao, setFuncao] = useState("");
    const [responsabilidade, setResponsabilidade] = useState("");
    const [porcentagem, setPorcentagem] = useState(0);
    const [foto, setFoto] = useState("");
    const [celular, setCelular] = useState("");

    const emailLogado = JSON.parse(localStorage.getItem("funcionario") || "{}").email;
    const isAdminMaster = emailLogado === "elderromero565@gmail.com";

    // AGORA ESTÁ NO LUGAR CERTO
    const editandoASiMesmo = modoEdicao && email === emailLogado;
    const editandoOutroUsuario = modoEdicao && email !== emailLogado;

    async function carregar() {
        try {
            const resp = await fetch(`${API_URL}/api/usuarios/todos`);
            const dados = await resp.json();

            const dadosTratados = dados.map(u => ({
                ...u,
                porcentagem: Number(u.porcentagem) || 0
            }));

            const flayra = dadosTratados.find(u =>
                u.nome.toLowerCase().includes("flayra")
            );

            let outros = dadosTratados.filter(u =>
                !u.nome.toLowerCase().includes("flayra")
            );

            outros = outros.sort((a, b) => b.porcentagem - a.porcentagem);

            let resultado = [];

            if (outros.length > 0) resultado.push(outros[0]);
            if (flayra) resultado.push(flayra);
            if (outros.length > 1) resultado = resultado.concat(outros.slice(1));

            setLista(resultado);

        } catch (err) {
            console.log("Erro ao buscar lista");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    function iniciarEdicao(usuario) {
        setModoEdicao(true);
        setItemEditando(usuario.id);
        setNome(usuario.nome);
        setSobrenome(usuario.sobrenome);
        setEmail(usuario.email);

        if (isAdminMaster) {
            setSenha(usuario.senha);
        } else {
            if (usuario.email === emailLogado) {
                setSenha(usuario.senha);
            } else {
                setSenha("Oculta");
            }
        }

        setFuncao(usuario.funcao);
        setResponsabilidade(usuario.responsabilidade);
        setPorcentagem(usuario.porcentagem);
        setFoto(usuario.foto);
        setCelular(usuario.celular || "");

    }

    function limparFormulario() {
        setModoEdicao(false);
        setItemEditando(null);
        setNome("");
        setSobrenome("");
        setEmail("");
        setSenha("");
        setFuncao("");
        setResponsabilidade("");
        setPorcentagem(0);
        setFoto("");
        setCelular("");

    }

    async function salvar() {
        const body = {
            nome,
            sobrenome,
            email,
            senha,
            funcao,
            responsabilidade,
            porcentagem,
            foto,
            celular
        };

        if (!isAdminMaster && senha === "Oculta" && email !== emailLogado) {
            delete body.senha;
        }

        if (modoEdicao) {
            body.id = itemEditando;

            await fetch(`${API_URL}/api/usuarios/atualizar`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(`${API_URL}/api/usuarios/inserir`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        }

        limparFormulario();
        carregar();
    }

    async function apagar(id) {
        await fetch(`${API_URL}/api/usuarios/apagar?id=${id}`, { method: "DELETE" });
        carregar();
    }

    return (
        <div className="fa-container fa-admin-container">
            <h2 className="fa-titulo fa-admin-titulo">Sócios Executivos</h2>

            <div className="fa-form fa-admin-formulario">

                <input
                    className="fa-input fa-input-nome"
                    placeholder="Nome"
                    value={nome}
                    readOnly={editandoOutroUsuario && !isAdminMaster && !editandoASiMesmo}
                    onChange={e => {
                        if (isAdminMaster || !modoEdicao || editandoASiMesmo) {
                            setNome(e.target.value);
                        }
                    }}
                />

                <input
                    className="fa-input fa-input-sobrenome"
                    placeholder="Sobrenome"
                    value={sobrenome}
                    readOnly={editandoOutroUsuario && !isAdminMaster && !editandoASiMesmo}
                    onChange={e => {
                        if (isAdminMaster || !modoEdicao || editandoASiMesmo) {
                            setSobrenome(e.target.value);
                        }
                    }}
                />

                <input
                    className="fa-input fa-input-email"
                    placeholder="Email"
                    value={email}
                    readOnly={
                        editandoOutroUsuario && !isAdminMaster ||
                        (editandoASiMesmo ? false : false)
                    }
                    onChange={e => {
                        if (!modoEdicao || isAdminMaster || editandoASiMesmo) {
                            setEmail(e.target.value);
                        }
                    }}
                />

                {!modoEdicao || isAdminMaster || email === emailLogado ? (
                    <input
                        className="fa-input fa-input-senha"
                        placeholder="Senha"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                    />
                ) : (
                    <div className="fa-input fa-input-senha" style={{ opacity: 0.6 }}>
                        Oculta
                    </div>
                )}

                <input
                    className="fa-input fa-input-funcao"
                    placeholder="Função"
                    value={funcao}
                    readOnly={!isAdminMaster}
                    onChange={e => {
                        if (isAdminMaster) setFuncao(e.target.value);
                    }}
                />

                <input
                    className="fa-input fa-input-resp"
                    placeholder="Responsabilidade"
                    value={responsabilidade}
                    readOnly={!isAdminMaster}
                    onChange={e => {
                        if (isAdminMaster) setResponsabilidade(e.target.value);
                    }}
                />

                <input
                    className="fa-input fa-input-porcentagem"
                    placeholder="Porcentagem"
                    type="number"
                    value={porcentagem}
                    readOnly={!isAdminMaster}
                    onChange={e => {
                        if (isAdminMaster) setPorcentagem(e.target.value);
                    }}
                />

                <input
                    className="fa-input fa-input-foto"
                    placeholder="Foto (link)"
                    value={foto}
                    onChange={e => setFoto(e.target.value)}
                />
                <input
                    className="fa-input fa-input-celular"
                    placeholder="Celular"
                    value={celular}
                    onChange={e => setCelular(e.target.value)}
                />

                <button className="fa-botao fa-botao-salvar" onClick={salvar}>
                    {modoEdicao ? "Salvar Alterações" : "Adicionar Sócio"}
                </button>

                {modoEdicao && (
                    <button className="fa-botao fa-cancelar fa-botao-cancelar" onClick={limparFormulario}>
                        Cancelar
                    </button>
                )}
            </div>

            {loading ? (
                <p className="fa-loading">Carregando...</p>
            ) : (
                <table className="fa-tabela fa-admin-tabela">
                    <thead>
                        <tr className="fa-tabela-header">
                            <th className="fa-col-foto">Foto</th>
                            <th className="fa-col-nome">Nome</th>
                            <th className="fa-col-email">Email</th>
                            <th className="fa-col-cargo">Cargo</th>
                            <th className="fa-col-resp">Responsabilidade</th>
                            <th className="fa-col-porcentagem">Porcentagem</th>
                            <th className="fa-col-celular">Celular</th>

                            <th className="fa-col-acoes">Ações</th>

                        </tr>
                    </thead>

                    <tbody>
                        {lista.map((u) => (
                            <tr key={u.id} className="fa-linha">

                                <td className="fa-celula fa-foto-celula">
                                    <img src={u.foto || null} alt="" className="fa-foto" />
                                </td>

                                <td className="fa-celula fa-nome">
                                    {u.nome} {u.sobrenome}
                                </td>

                                <td className="fa-celula fa-email">{u.email}</td>

                                <td className="fa-celula fa-cargo">{u.funcao}</td>

                                <td className="fa-celula fa-resp">{u.responsabilidade}</td>

                                <td className="fa-celula fa-porcentagem">
                                    {u.porcentagem === 0 ? "Sócia complementar" : `${u.porcentagem}%`}
                                </td>
                                <td className="fa-celula fa-celular">{u.celular}</td>

                                <td className="fa-celula fa-acoes">
                                    <button className="fa-botao-editar" onClick={() => iniciarEdicao(u)}>
                                        Editar
                                    </button>

                                    <button className="fa-botao-apagar" onClick={() => apagar(u.id)}>
                                        Apagar
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

        </div>
    );
}
