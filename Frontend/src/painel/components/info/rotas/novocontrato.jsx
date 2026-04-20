import React, { useState } from "react";
import "./novocontrato.css";
import { API_URL } from "../../config";
import { useEffect } from "react";

export default function NovoContrato({ voltar, editando }) {

    const [integracoesLista, setIntegracoesLista] = useState([]);
    const [integracaoTemp, setIntegracaoTemp] = useState("");
    const [tecnologiasLista, setTecnologiasLista] = useState([]);
    const [tecnologiaTemp, setTecnologiaTemp] = useState("");
    const usuario = JSON.parse(localStorage.getItem("funcionario") || "{}");
    const [hospedagemLista, setHospedagemLista] = useState([]);
    const [hospedagemTemp, setHospedagemTemp] = useState("");
    const [paginasLista, setPaginasLista] = useState([]);
    const [paginaTipoTemp, setPaginaTipoTemp] = useState("");
    const [paginaDescricaoTemp, setPaginaDescricaoTemp] = useState("");

    const [form, setForm] = useState({
        representante_nome: "",
        documento_empresa: "",
        endereco_empresa: "",
        telefone_empresa: "",
        email_empresa: "",

        negocio_cliente: "",
        nome_cliente: "",
        documento_cliente: "",
        endereco_cliente: "",
        telefone_cliente: "",
        email_cliente: "",

        tipo_site: "",
        tecnologias: "",
        quantidade_paginas: "",
        numero_revisoes: "",

        prazo_entrega: "",

        valor_total: "",
        forma_pagamento: "",
        valor_entrada: "",
        valor_final_entrega: "",
        valor_revisao_extra: "",

        hospedagem_inclusa: "",
        valor_hospedagem: "",

        dias_suporte: "",
        atualizacoes_inclusas: "",
        cidade_foro: "",

        data_assinatura_contratada: "",
        data_assinatura_cliente: ""
    });



    useEffect(() => {
        async function carregar() {
            if (!editando) return;

            try {
                const resp = await fetch(`${API_URL}/contratos/${editando}`);
                const dados = await resp.json();

                setForm({
                    representante_nome: dados.representante_nome,
                    documento_empresa: dados.documento_empresa,
                    endereco_empresa: dados.endereco_empresa,
                    telefone_empresa: dados.telefone_empresa,
                    email_empresa: dados.email_empresa,

                    negocio_cliente: dados.negocio_cliente,
                    nome_cliente: dados.nome_cliente,
                    documento_cliente: dados.documento_cliente,
                    endereco_cliente: dados.endereco_cliente,
                    telefone_cliente: dados.telefone_cliente,
                    email_cliente: dados.email_cliente,

                    tipo_site: dados.tipo_site,
                    tecnologias: dados.tecnologias,
                    quantidade_paginas: dados.quantidade_paginas,
                    numero_revisoes: dados.numero_revisoes,

                    prazo_entrega: dados.prazo_entrega,

                    valor_total: dados.valor_total,
                    forma_pagamento: dados.forma_pagamento,
                    valor_entrada: dados.valor_entrada,
                    valor_final_entrega: dados.valor_final_entrega,
                    valor_revisao_extra: dados.valor_revisao_extra,

                    hospedagem_inclusa: dados.hospedagem_inclusa,
                    valor_hospedagem: dados.valor_hospedagem,

                    dias_suporte: dados.dias_suporte,
                    atualizacoes_inclusas: dados.atualizacoes_inclusas,
                    cidade_foro: dados.cidade_foro,

                    data_assinatura_contratada: dados.data_assinatura_contratada,
                    data_assinatura_cliente: dados.data_assinatura_cliente
                });

                setIntegracoesLista(
                    dados.integracoes
                        ? dados.integracoes.split(",").map(t => t.trim())
                        : []
                );

                setTecnologiasLista(
                    dados.tecnologias
                        ? dados.tecnologias.split(",").map(t => t.trim())
                        : []
                );

                setHospedagemLista(
                    dados.valor_hospedagem
                        ? dados.valor_hospedagem.split(",").map(t => t.trim())
                        : []
                );

                // carregamento das páginas do contrato
                try {
                    const respPaginas = await fetch(`${API_URL}/paginas/${editando}`);
                    const listaPaginas = await respPaginas.json();
                    setPaginasLista(listaPaginas);
                } catch {
                    setPaginasLista([]);
                }

            } catch (err) {
                alert("Erro ao carregar dados do contrato para edição");
            }
        }

        carregar();
    }, [editando]);

    useEffect(() => {
        if (editando) return;

        setForm(f => ({
            ...f,
            representante_nome: `${usuario.nome} ${usuario.sobrenome}, ${usuario.funcao}`,
            endereco_empresa: "https://www.ironexecutions.com.br",
            telefone_empresa: usuario.celular,
            email_empresa: "ironexecutions@gmail.com"
        }));
    }, []);

    function atualizar(campo, valor) {
        setForm({ ...form, [campo]: valor });
    }

    function adicionarIntegracao() {
        if (!integracaoTemp.trim()) return;

        setIntegracoesLista([...integracoesLista, integracaoTemp.trim()]);
        setIntegracaoTemp("");
    }
    function adicionarTecnologia() {
        if (!tecnologiaTemp.trim()) return;

        setTecnologiasLista([...tecnologiasLista, tecnologiaTemp.trim()]);
        setTecnologiaTemp("");
    }

    async function salvar() {

        const dadosEnviar = {
            ...form,
            integracoes: integracoesLista.join(", "),
            tecnologias: tecnologiasLista.join(", "),
            valor_hospedagem: hospedagemLista.join(", "),
            paginas: paginasLista

        };


        try {

            const url = editando
                ? `${API_URL}/contratos/${editando}`
                : `${API_URL}/contratos/novo`;

            const metodo = editando ? "PUT" : "POST";

            const resp = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosEnviar)
            });

            const dados = await resp.json();

            if (resp.ok) {
                if (editando) {
                    alert("Contrato atualizado com sucesso");
                } else {
                    alert("Contrato criado com sucesso. Código: " + dados.codigo);
                }

                voltar();
            } else {
                alert("Erro: " + (dados.detail || "Erro desconhecido"));
            }

        } catch (err) {
            alert("Erro ao conectar com o servidor");
        }
    }
    useEffect(() => {
        setForm(f => ({
            ...f,
            quantidade_paginas: paginasLista.length.toString()
        }));
    }, [paginasLista]);


    return (
        <div className="novo-contrato-container">
            <h2>{editando ? "Editar Contrato" : "Novo Contrato"}</h2>

            <div className="formulario">

                <h3>Dados da Contratação</h3>

                <input
                    placeholder="Responsável"
                    value={form.representante_nome}
                    onChange={e => atualizar("representante_nome", e.target.value)}
                />


                <input style={{ display: "none" }} placeholder="Documento da empresa"
                    value={form.documento_empresa}
                    onChange={e => atualizar("documento_empresa", e.target.value)} />

                <input
                    placeholder="link da empresa"
                    value={form.endereco_empresa}
                    onChange={e => atualizar("endereco_empresa", e.target.value)}
                />


                <input
                    placeholder="Telefone da empresa"
                    value={form.telefone_empresa}
                    onChange={e => atualizar("telefone_empresa", e.target.value)}
                />


                <input
                    placeholder="Email"
                    value={form.email_empresa || "ironexecutions@gmail.com"}
                    onChange={e => atualizar("email_empresa", e.target.value)}
                />



                <h3>Dados do Cliente</h3>

                <input placeholder="Negócio do cliente"
                    value={form.negocio_cliente}
                    onChange={e => atualizar("negocio_cliente", e.target.value)} />

                <input placeholder="Nome do cliente"
                    value={form.nome_cliente}
                    onChange={e => atualizar("nome_cliente", e.target.value)} />

                <input placeholder="Documento do cliente"
                    value={form.documento_cliente}
                    onChange={e => atualizar("documento_cliente", e.target.value)} />

                <input placeholder="Endereço do cliente"
                    value={form.endereco_cliente}
                    onChange={e => atualizar("endereco_cliente", e.target.value)} />

                <input placeholder="Telefone do cliente"
                    value={form.telefone_cliente}
                    onChange={e => atualizar("telefone_cliente", e.target.value)} />

                <input placeholder="Email do cliente"
                    value={form.email_cliente}
                    onChange={e => atualizar("email_cliente", e.target.value)} />

                <h3>Páginas do Projeto</h3>

                <div className="integracao-linha">
                    <input
                        placeholder="Nome da página, por exemplo Home ou Dashboard"
                        value={paginaTipoTemp}
                        onChange={e => setPaginaTipoTemp(e.target.value)}
                    />
                    <input
                        placeholder="Descrição da página"
                        value={paginaDescricaoTemp}
                        onChange={e => setPaginaDescricaoTemp(e.target.value)}
                    />

                    <button
                        className="botao-add"
                        onClick={() => {
                            if (!paginaTipoTemp.trim() || !paginaDescricaoTemp.trim()) return;

                            setPaginasLista([
                                ...paginasLista,
                                {
                                    tipo: paginaTipoTemp.trim(),
                                    descricao: paginaDescricaoTemp.trim()
                                }
                            ]);

                            setPaginaTipoTemp("");
                            setPaginaDescricaoTemp("");
                        }}
                    >
                        +
                    </button>
                </div>

                <div className="integracoes-lista">
                    {paginasLista.map((p, i) => (
                        <p key={i} className="integracao-item">
                            • {p.tipo}   |   {p.descricao}
                        </p>
                    ))}
                </div>

                <h3>Informações do Projeto</h3>

                <h4>Tecnologias</h4>

                <div className="integracao-linha">
                    <input
                        placeholder="Digite ou escolha uma tecnologia"
                        list="lista-tecnologias"
                        value={tecnologiaTemp}
                        onChange={e => setTecnologiaTemp(e.target.value)}
                    />

                    <button className="botao-add" onClick={adicionarTecnologia}>
                        +
                    </button>
                </div>

                <datalist id="lista-tecnologias">
                    <option value="HTML" />
                    <option value="CSS" />
                    <option value="JavaScript" />
                    <option value="React" />
                    <option value="Vite" />
                    <option value="Next.js" />
                    <option value="TailwindCSS" />
                    <option value="Bootstrap" />
                    <option value="Node.js" />
                    <option value="Express" />
                    <option value="MySQL" />
                    <option value="Supabase" />
                    <option value="Firebase" />
                    <option value="PHP" />
                    <option value="Python" />
                    <option value="FastAPI" />
                    <option value="Django" />
                    <option value="Figma" />
                    <option value="Canva" />
                    <option value="Stripe" />
                    <option value="Mercado Pago" />
                </datalist>

                <div className="integracoes-lista">
                    {tecnologiasLista.map((item, i) => (
                        <p key={i} className="integracao-item">
                            • {item}
                        </p>
                    ))}
                </div>
                <input
                    placeholder="Quantidade de páginas"
                    value={form.quantidade_paginas}
                    readOnly
                />

                {/* INTEGRAÇÕES */}
                <h3>Integrações</h3>

                <div className="integracao-linha">
                    <input
                        placeholder="Escreva uma integração"
                        list="lista-integracoes"
                        value={integracaoTemp}
                        onChange={e => setIntegracaoTemp(e.target.value)}
                    />

                    <button className="botao-add" onClick={adicionarIntegracao}>
                        +
                    </button>
                </div>

                <datalist id="lista-integracoes">
                    <option value="WhatsApp automático" />
                    <option value="Formulário enviando para EmailJS" />
                    <option value="Google Maps" />
                    <option value="Integração com Instagram" />
                    <option value="Chatbot WhatsApp" />
                    <option value="Chat Crisp" />
                    <option value="Chat Tawk.to" />
                    <option value="Chatbase" />
                    <option value="Pagamento MercadoPago" />
                    <option value="Pagamento Stripe" />
                    <option value="Pagamento PayPal" />
                    <option value="Google Sheets" />
                    <option value="Notion Forms" />
                    <option value="API externa" />
                    <option value="Supabase" />
                    <option value="MySQL" />
                    <option value="Firebase" />
                    <option value="Envio SMTP" />
                    <option value="Facebook Pixel" />
                    <option value="Google Analytics" />
                </datalist>

                <div className="integracoes-lista">
                    {integracoesLista.map((item, i) => (
                        <p key={i} className="integracao-item">
                            • {item}
                        </p>
                    ))}
                </div>


                <input placeholder="Número de revisões"
                    value={form.numero_revisoes}
                    onChange={e => atualizar("numero_revisoes", e.target.value)} />


                <h3>Prazos da entrega</h3>

                <input placeholder="Prazo de entrega (dias)"
                    value={form.prazo_entrega}
                    onChange={e => atualizar("prazo_entrega", e.target.value)} />


                <h3>Pagamento</h3>

                <input placeholder="Valor total"
                    value={form.valor_total}
                    onChange={e => atualizar("valor_total", e.target.value)} />

                <select
                    value={form.forma_pagamento}
                    onChange={e => atualizar("forma_pagamento", e.target.value)}
                    className="select-contrato"
                >
                    <option value="">Selecione a forma de pagamento</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                </select>


                <input placeholder="Valor de entrada"
                    value={form.valor_entrada}
                    onChange={e => atualizar("valor_entrada", e.target.value)} />

                <input placeholder="Valor final na entrega"
                    value={form.valor_final_entrega}
                    onChange={e => atualizar("valor_final_entrega", e.target.value)} />

                <input placeholder="Valor por revisão extra"
                    value={form.valor_revisao_extra}
                    onChange={e => atualizar("valor_revisao_extra", e.target.value)} />


                <h3>Hospedagem e Suporte</h3>

                <select
                    value={form.hospedagem_inclusa}
                    onChange={e => atualizar("hospedagem_inclusa", e.target.value)}
                    className="select-contrato"
                >
                    <option value="">Hospedagem inclusa?</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </select>

                {/* Entrada + botão */}
                {form.hospedagem_inclusa === "Não" ? (
                    <input
                        value="Não tem hospedagem"
                        readOnly
                        className="input-desabilitado"
                    />
                ) : (
                    <>
                        <div className="integracao-linha">
                            <input
                                placeholder="Hospedagem/Servidor/Banco de dados/etc"
                                value={hospedagemTemp}
                                onChange={e => setHospedagemTemp(e.target.value)}
                            />

                            <button
                                className="botao-add"
                                onClick={() => {
                                    if (!hospedagemTemp.trim()) return;
                                    setHospedagemLista([...hospedagemLista, hospedagemTemp.trim()]);
                                    setHospedagemTemp("");
                                }}
                            >
                                +
                            </button>
                        </div>

                        {/* Lista aparecendo embaixo */}
                        <div className="integracoes-lista">
                            {hospedagemLista.map((item, i) => (
                                <p key={i} className="integracao-item">• {item}</p>
                            ))}
                        </div>
                    </>
                )}


                <h3>Foro e Assinaturas</h3>

                <input placeholder="Cidade do foro"
                    value={form.cidade_foro}
                    onChange={e => atualizar("cidade_foro", e.target.value)} />

                <button className="salvar" onClick={salvar}>
                    Salvar Contrato
                </button>

                <button className="cancelar" onClick={voltar}>
                    Cancelar
                </button>

            </div>
        </div>
    );
}
