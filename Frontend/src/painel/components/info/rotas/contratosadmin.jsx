import React, { useEffect, useState } from "react";
import "./contratosadmin.css";
import { API_URL } from "../../config";
import NovoContrato from "./novocontrato";
import AssinaturaCanvas from "./assinaturacanvas";

export default function ContratosAdmin({ onModoChange }) {

    const [modo, setModo] = useState("menu");
    const [lista, setLista] = useState([]);
    const [contratoSelecionado, setContratoSelecionado] = useState(null);
    const [abrirModalAssinatura, setAbrirModalAssinatura] = useState(false);
    const [tipoAssinaturaAtual, setTipoAssinaturaAtual] = useState(null);
    const [editandoId, setEditandoId] = useState(null);
    const usuario = JSON.parse(localStorage.getItem("funcionario") || "{}");


    const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    const API_URL_FIXO = isLocal
        ? "http://127.0.0.1:8889"
        : "https://ironexecutions-backend.onrender.com";

    useEffect(() => {
        if (onModoChange) {
            onModoChange(modo);
        }
    }, [modo]);
    function abrirAssinatura(tipo) {
        setTipoAssinaturaAtual(tipo);
        setAbrirModalAssinatura(true);
    }

    function fecharAssinatura() {
        setAbrirModalAssinatura(false);
        setTipoAssinaturaAtual(null);
    }
    async function carregarContratos() {
        try {
            const resp = await fetch(`${API_URL_FIXO}/contratos`);
            const dados = await resp.json();
            console.log("RETORNO DA API /contratos:", dados);
            setLista(dados);
        } catch (err) {
            console.log("Erro ao carregar contratos", err);
        }
    }


    function abrirLista() {
        carregarContratos();
        setModo("lista");
    }

    async function abrirContrato(item) {
        try {
            const resp = await fetch(`${API_URL_FIXO}/contratos/${item.id}`);
            const dados = await resp.json();
            setContratoSelecionado(dados);
            setModo("ver");
        } catch (err) {
            console.log("Erro ao carregar contrato completo", err);
        }
    }
    async function apagarContrato(id, usuarioId) {
        const c1 = window.confirm("Deseja mesmo apagar este contrato?");
        if (!c1) return;

        const c2 = window.confirm("Tem certeza absoluta disso?");
        if (!c2) return;

        try {
            const resp = await fetch(`${API_URL_FIXO}/contratos/${id}?usuario_id=${usuarioId}`, {
                method: "DELETE"
            });

            if (resp.ok) {
                await carregarContratos();
                alert("Contrato removido com sucesso.");


            } else {
                alert("Erro ao apagar o contrato.");
            }

        } catch (e) {
            alert("Erro ao conectar ao servidor.");
        }
    }
    function copiarMensagemProfissional(item) {
        const link = `${window.location.origin}/contrato/${item.codigo}`;
        const texto =
            `Segue o PDF do seu contrato digital da Iron Executions. Nele você encontra as informações do projeto, prazos e condições acordadas.

Estou à disposição para qualquer dúvida.
`;

        navigator.clipboard.writeText(texto);
        alert("Texto profissional copiado.");
    }

    async function salvarData(id, campo, valor) {
        try {
            await fetch(`${API_URL_FIXO}/contratos/${id}/data`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campo,
                    valor
                })
            });
        } catch (err) {
            console.log("Erro ao salvar data", err);
        }
    }
    useEffect(() => {
        if (!contratoSelecionado) return;
        if (!contratoSelecionado.codigo) return;
        if (modo !== "ver") return;

        window.open(`/contrato/${contratoSelecionado.codigo}`, "_blank");
    }, [modo, contratoSelecionado]);

    return (
        <div className="da-box">

            {abrirModalAssinatura && (
                <div className="modal-assinatura-fundo">
                    <div className="modal-assinatura-box">

                        <button className="modal-assinatura-fechar" onClick={fecharAssinatura}>
                            Fechar
                        </button>

                        <AssinaturaCanvas
                            idContrato={contratoSelecionado.id}
                            tipo={tipoAssinaturaAtual}
                            onFinalizado={(url) => {
                                if (tipoAssinaturaAtual === "contratada") {
                                    setContratoSelecionado({
                                        ...contratoSelecionado,
                                        LOGO_ASSINATURA_CONTRATADA: url
                                    });
                                } else {
                                    setContratoSelecionado({
                                        ...contratoSelecionado,
                                        LOGO_ASSINATURA_CLIENTE: url
                                    });
                                }

                                fecharAssinatura();
                            }}
                        />
                    </div>
                </div>
            )}

            <h2 className="da-titulo">Contratos</h2>

            {modo === "menu" && (
                <div className="da-botoes-contratos">
                    <button onClick={() => setModo("novo")}>
                        Novo contrato
                    </button>

                    <button onClick={abrirLista}>
                        Contratos
                    </button>
                </div>
            )}

            {modo === "lista" && (
                <>
                    <button className="btn-voltar" onClick={() => setModo("menu")}>
                        Voltar
                    </button>

                    <div className="lista-simples">
                        {lista
                            .filter(item => item.apagado !== 1)
                            .map(item => (
                                <div key={item.id} className="linha-cliente">

                                    <div className="linha-click" onClick={() => abrirContrato(item)}>
                                        <p>{item.nome_cliente}</p>
                                        <span>{item.telefone_cliente}</span>
                                    </div>

                                    <div className="acoes-lista">
                                        <button
                                            className="btn-abrir"
                                            onClick={() => copiarMensagemProfissional(item)}
                                        >
                                            Copiar
                                        </button>
                                        <button
                                            className="btn-abrir"
                                            onClick={() => {
                                                const url = `/contrato/${item.codigo}`;
                                                window.open(url, "_blank");
                                            }}
                                        >
                                            Abrir
                                        </button>


                                        <button
                                            className="btn-editar"
                                            onClick={() => {
                                                setEditandoId(item.id);
                                                setModo("novo");
                                            }}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="btn-apagar"
                                            onClick={() => apagarContrato(item.id, usuario.id)}
                                        >
                                            Apagar
                                        </button>


                                    </div>


                                </div>
                            ))}
                    </div>
                </>
            )}


            {modo === "ver" && contratoSelecionado && (

                <div className="contrato-documento">

                    <button
                        className="btn-voltar"
                        onClick={() => {
                            setContratoSelecionado(null);
                            setModo("lista");
                        }}
                        style={{ marginBottom: "20px" }}
                    >
                        Voltar
                    </button>


                    <h2 className="titulo-documento">
                        Este contrato é apenas para ser assinado pelo Representante da Iron Executions não possui valor legal, o contrato valido <br /> e para ser assinado pelo cliente é <a
                            href={`/contrato/${contratoSelecionado.codigo}`}
                            rel="noopener noreferrer"
                            className="link-codigo"
                        >
                            este                        </a>
                    </h2>

                    <p className="linha intro">
                        Pelo presente instrumento particular, as partes abaixo identificadas
                        resolvem firmar o presente Contrato de Prestação de Serviços de
                        Desenvolvimento de Site, que será regido pelas cláusulas e condições a seguir.
                    </p>

                    {/* CONTRATADA */}
                    <h3 className="subtitulo">CLÁUSULA 1 — IDENTIFICAÇÃO DAS PARTES</h3>

                    <p className="linha bloco-titulo">Contratada</p>
                    <p className="linha">Nome empresarial: <strong>  Iron Executions </strong></p>
                    <p className="linha">
                        Responsável: <strong>{contratoSelecionado.representante_nome}</strong>
                    </p>

                    <p className="linha" style={{ display: "none" }}>
                        Documento: <strong>{contratoSelecionado.documento_empresa}</strong>
                    </p>

                    <p className="linha">
                        Link institucional: <strong>{contratoSelecionado.endereco_empresa}</strong>
                    </p>

                    <p className="linha">
                        Contato: <strong>{contratoSelecionado.telefone_empresa}</strong>
                    </p>

                    <p className="linha">
                        E-mail: <strong>{contratoSelecionado.email_empresa}</strong>
                    </p>

                    <p className="linha bloco-titulo">Contratante</p>

                    <p className="linha">
                        Negócio: <strong>{contratoSelecionado.negocio_cliente}</strong>
                    </p>

                    <p className="linha">
                        Representante: <strong>{contratoSelecionado.nome_cliente}</strong>
                    </p>

                    <p className="linha">
                        Documento: <strong>{contratoSelecionado.documento_cliente}</strong>
                    </p>

                    <p className="linha">
                        Endereço: <strong>{contratoSelecionado.endereco_cliente}</strong>
                    </p>

                    <p className="linha">
                        Contato: <strong>{contratoSelecionado.telefone_cliente}</strong>
                    </p>

                    <p className="linha">
                        E-mail: <strong>{contratoSelecionado.email_cliente}</strong>
                    </p>

                    {/* OBJETO */}
                    <h3 className="subtitulo">CLÁUSULA 2 — OBJETO DO CONTRATO</h3>

                    <p className="linha">
                        O presente contrato tem por objeto a criação e o desenvolvimento de um site
                        conforme solicitado pelo contratante, atendendo às especificações abaixo.
                    </p>

                    <p className="linha">
                        Tipo de site: <strong>{contratoSelecionado.tipo_site}</strong>
                    </p>

                    <p className="linha">
                        Tecnologias utilizadas: <strong>{contratoSelecionado.tecnologias}</strong>
                    </p>

                    <p className="linha">
                        Quantidade de páginas: <strong>{contratoSelecionado.quantidade_paginas}</strong>
                    </p>

                    {/* ESCOPO */}
                    <h3 className="subtitulo">CLÁUSULA 3 — ESCOPO E LIMITAÇÕES</h3>

                    <p className="linha">
                        O desenvolvimento inclui apenas os elementos e funcionalidades descritos abaixo. Qualquer recurso não listado será considerado serviço adicional e poderá gerar novo orçamento.                    </p>

                    <p className="linha">
                        Integrações previstas: <strong>{contratoSelecionado.integracoes}</strong>
                    </p>

                    <p className="linha">
                        Revisões inclusas: <strong>{contratoSelecionado.numero_revisoes}</strong>
                    </p>

                    <p className="linha">
                        Atualizações inclusas: <strong>{contratoSelecionado.atualizacoes_inclusas}</strong>
                    </p>



                    <p className="linha obs">
                        * As <strong>revisões </strong>  correspondem às alterações solicitadas pelo contratante durante o
                        desenvolvimento do site. O número de revisões informado neste contrato define
                        quantas modificações podem ser realizadas dentro do acordo sem custos
                        adicionais. Revisões extras, solicitadas após o limite contratado, terão custo
                        adicional conforme tabela vigente. <br />
                        * As <strong> atualizações </strong>  referem-se a ajustes
                        realizados depois da entrega final do site. Essas atualizações incluem apenas
                        alterações visuais no layout, sem mudanças de estrutura, criação de novas
                        páginas, inclusão de funcionalidades ou modificações profundas no projeto.
                    </p>


                    {/* PRAZOS */}
                    <h3 className="subtitulo">CLÁUSULA 4 — PRAZO DE ENTREGA</h3>

                    <p className="linha">
                        O prazo estimado para entrega do projeto é de
                        <strong> {contratoSelecionado.prazo_entrega} dias úteis</strong>, considerando que os sábados são
                        contabilizados normalmente. Apenas os domingos não entram na contagem do prazo.
                        O período começa após o envio de todas as informações, textos, imagens e materiais
                        necessários por parte do contratante.
                    </p>

                    {/* PAGAMENTO */}
                    <h3 className="subtitulo">CLÁUSULA 5 — VALORES E FORMAS DE PAGAMENTO</h3>

                    <p className="linha">
                        Valor total do projeto: R$ <strong>{contratoSelecionado.valor_total}</strong>
                    </p>

                    <p className="linha">
                        Forma de pagamento: <strong>{contratoSelecionado.forma_pagamento}</strong>
                    </p>

                    <p className="linha">
                        Entrada: R$ <strong>{contratoSelecionado.valor_entrada}</strong>
                    </p>

                    <p className="linha">
                        Valor final na entrega: R$ <strong>{contratoSelecionado.valor_final_entrega}</strong>
                    </p>

                    <p className="linha">
                        Valor por revisão extra: R$ <strong>{contratoSelecionado.valor_revisao_extra}</strong>
                    </p>


                    <p className="linha obs">
                        A liberação final do projeto acontece somente após o pagamento total acordado,
                        incluindo a entrega dos arquivos, a ativação no domínio e o acesso administrativo do site.
                        O suporte não cobre erros causados pelo contratante, nem alterações realizadas por terceiros
                        depois da entrega. O suporte também não cobre mudanças em plataformas externas como PayPal,
                        Google ou Instagram, uma vez que essas plataformas podem atualizar seus sistemas sem aviso prévio.
                        O suporte abrange apenas problemas diretamente relacionados ao código original entregue.
                    </p>


                    {/* HOSPEDAGEM */}
                    <h3 className="subtitulo">CLÁUSULA 6 — HOSPEDAGEM E SUPORTE</h3>

                    <p className="linha">
                        Hospedagem inclusa: <strong>{contratoSelecionado.hospedagem_inclusa}</strong>
                    </p>

                    <p className="linha">
                        Recursos de hospedagem:
                    </p>

                    {contratoSelecionado.hospedagem_inclusa === "Não" ? (
                        <p className="linha">
                            <strong>Não possui hospedagem</strong>
                        </p>
                    ) : (
                        <ul className="lista-hospedagem">
                            {String(contratoSelecionado.valor_hospedagem)
                                .split(",")
                                .map((item, i) => (
                                    <li key={i}>{item.trim()}</li>
                                ))}
                        </ul>
                    )}



                    <p className="linha">
                        O contratante receberá <strong>{contratoSelecionado.dias_suporte} dias</strong> de suporte gratuito para
                        correções de erros, ajustes técnicos simples ou dúvidas sobre o uso do site.
                    </p>

                    <p className="linha obs">
                        Modificações estruturais, redesign completo, criação de novas seções, automações avançadas ou qualquer recurso adicional não são considerados suporte. Esses itens são tratados como novos serviços e exigem orçamento separado.
                    </p>

                    {/* FORO */}
                    <h3 className="subtitulo">CLÁUSULA 7 — FORO</h3>

                    <p className="linha">
                        Em caso de qualquer divergência relacionada a este contrato, as partes elegem o foro da cidade de
                        <strong> {contratoSelecionado.cidade_foro}</strong> como o responsável para resolver questões judiciais,
                        com renúncia a qualquer outro foro que possa ser aplicável.
                    </p>
                    {/* OBRIGAÇÕES DO CONTRATANTE */}
                    <h3 className="subtitulo">CLÁUSULA 8 — OBRIGAÇÕES DO CONTRATANTE</h3>

                    <p className="linha">
                        O contratante se compromete a enviar todos os textos, imagens, vídeos, logotipo,
                        cores e demais materiais necessários para o desenvolvimento. O prazo de entrega
                        somente começa a contar após o envio completo desses itens.
                    </p>

                    <p className="linha">
                        O contratante declara que possui direitos legais sobre todo o conteúdo enviado
                        para o site, isentando a contratada de qualquer responsabilidade por direitos autorais.
                    </p>

                    <p className="linha">
                        O contratante compromete-se a responder aprovações, revisões e confirmações dentro
                        de até 5 dias úteis. A ausência de resposta poderá gerar atrasos no cronograma sem
                        que isso seja considerado responsabilidade da contratada.
                    </p>

                    <p className="linha">
                        O contratante deve fornecer acessos quando solicitados, como contas Google, redes
                        sociais, hospedagem e demais plataformas integradas.
                    </p>


                    {/* PROPRIEDADE INTELECTUAL */}
                    <h3 className="subtitulo">CLÁUSULA 9 — PROPRIEDADE INTELECTUAL</h3>

                    <p className="linha">
                        Todo o código, estrutura, componentes internos, automações e design produzidos pela
                        contratada permanecem como propriedade exclusiva da Iron Executions até o pagamento
                        total do projeto.
                    </p>

                    <p className="linha">
                        Após o pagamento integral, o contratante recebe o direito de uso do site, proibindo-se
                        expressamente revenda, redistribuição, clonagem, cópia comercial ou cessão do projeto
                        a terceiros sem autorização da contratada.
                    </p>

                    <p className="linha">
                        Ferramentas internas, scripts proprietários e sistemas utilizados pela contratada continuam
                        sendo propriedade da Iron Executions mesmo após a entrega final.
                    </p>


                    {/* RESCISÃO E CANCELAMENTO */}
                    <h3 className="subtitulo">CLÁUSULA 10 — RESCISÃO E CANCELAMENTO</h3>

                    <p className="linha">
                        A entrada paga pelo contratante não é reembolsável, pois cobre custos iniciais, design,
                        planejamento e reserva de agenda.
                    </p>

                    <p className="linha">
                        Caso o contratante solicite cancelamento após o início do desenvolvimento, será cobrada
                        multa de 30% do valor restante ou o valor proporcional às horas trabalhadas, prevalecendo
                        o maior.
                    </p>

                    <p className="linha">
                        Caso o cancelamento ocorra após a entrega do site, a cobrança total do projeto será devida,
                        independentemente do uso futuro.
                    </p>

                    <p className="linha">
                        Se o contratante deixar de responder ou não enviar materiais por mais de 30 dias, o projeto
                        poderá ser pausado e só será retomado conforme disponibilidade da equipe e possível reajuste
                        de valores.
                    </p>


                    {/* LIMITAÇÃO DE RESPONSABILIDADE */}
                    <h3 className="subtitulo">CLÁUSULA 11 — LIMITAÇÃO DE RESPONSABILIDADE</h3>

                    <p className="linha">
                        A contratada não se responsabiliza por instabilidades, falhas, mudanças de políticas ou
                        limitações em plataformas externas como Instagram, WhatsApp, Google, PayPal e serviços de
                        hospedagem de terceiros.
                    </p>

                    <p className="linha">
                        A contratada também não é responsável por erros causados por terceiros ou modificações
                        realizadas pelo contratante após a entrega.
                    </p>

                    <p className="linha">
                        Não há garantia de aumento de vendas, engajamento ou resultados financeiros, pois tais fatores
                        dependem de variáveis externas ao desenvolvimento do site.
                    </p>

                    <p className="linha">
                        A assinatura digital utilizada neste contrato tem validade jurídica conforme a Lei nº 14.063/2020,
                        reconhecida oficialmente em território nacional.
                    </p>


                    {/* ASSINATURAS */}
                    <h3 className="subtitulo">CLÁUSULA 12 — ASSINATURAS  & COMPROVANTE DE PAGAMENTO</h3>
                    {/* Comprovante de pagamento */}
                    <div className="comprovante-box">

                        <h4 style={{ margin: "10px 0" }}>
                            Comprovante de pagamento
                        </h4>

                        {contratoSelecionado.comprovante ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                                <div className="comprovante-acoes">

                                    <button
                                        className="btn-ver-comprovante"
                                        onClick={() => window.open(contratoSelecionado.comprovante, "_blank")}
                                    >
                                        Ver comprovante
                                    </button>

                                    <button
                                        className="btn-substituir-comprovante"
                                        onClick={() => {
                                            setContratoSelecionado({
                                                ...contratoSelecionado,
                                                comprovante: null
                                            });
                                        }}
                                    >
                                        Substituir comprovante
                                    </button>

                                </div>

                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    id="input-comprovante"
                                    style={{ display: "none" }}
                                    onChange={async (e) => {
                                        const pdf = e.target.files[0];
                                        if (!pdf) return;

                                        const form = new FormData();
                                        form.append("arquivo", pdf);

                                        const resp = await fetch(
                                            `${API_URL_FIXO}/contratos/${contratoSelecionado.id}/salvar-comprovante`,

                                            { method: "POST", body: form }
                                        );


                                        const dados = await resp.json();

                                        if (resp.ok && dados.url) {
                                            setContratoSelecionado({
                                                ...contratoSelecionado,
                                                comprovante: dados.url
                                            });
                                            alert("Comprovante salvo com sucesso.");
                                        } else {
                                            alert("Erro ao enviar o comprovante.");
                                            console.log("Erro:", dados);
                                        }
                                    }}
                                />

                                <button
                                    className="btn-assinar"
                                    onClick={() =>
                                        document.getElementById("input-comprovante").click()
                                    }
                                >
                                    Enviar comprovante em PDF
                                </button>
                            </>
                        )}

                    </div>

                    <p className="linha">
                        As partes confirmam o acordo e autorizam o prosseguimento do projeto.                    </p>

                    <div className="assinaturas-bloco">

                        {/* Assinatura da empresa */}
                        <div className="assinatura">
                            <p>Contratado(a): <strong> {contratoSelecionado.representante_nome} </strong>  <br /> Representante de: <strong> Iron Executions </strong> </p>
                            <div style={{ marginBottom: "8px" }}>
                                <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>Data:</label>
                                <input
                                    type="date"
                                    value={contratoSelecionado.data_assinatura_contratada || ""}
                                    onChange={e => {
                                        const novaData = e.target.value;
                                        setContratoSelecionado({
                                            ...contratoSelecionado,
                                            data_assinatura_contratada: novaData
                                        });
                                        salvarData(contratoSelecionado.id, "data_assinatura_contratada", novaData);
                                    }}
                                    className="input-data-assinatura"
                                    style={{
                                        padding: "6px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        marginTop: "4px",
                                        width: "160px"
                                    }}
                                />
                            </div>

                            {contratoSelecionado.LOGO_ASSINATURA_CONTRATADA ? (
                                <>
                                    <img
                                        src={contratoSelecionado.LOGO_ASSINATURA_CONTRATADA}
                                        className="img-assinatura"
                                        alt="Assinatura contratada"
                                    />

                                    <button
                                        className="btn-reassinar"
                                        onClick={() => {
                                            setContratoSelecionado({
                                                ...contratoSelecionado,
                                                LOGO_ASSINATURA_CONTRATADA: null
                                            });
                                            abrirAssinatura("contratada");
                                        }}


                                    >
                                        Reassinar
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-assinar"
                                    onClick={() => abrirAssinatura("contratada")}
                                >
                                    Assinar
                                </button>

                            )}
                        </div>

                        {/* Assinatura do cliente */}
                        <div className="assinatura">
                            <p>Contratante: <strong> {contratoSelecionado.nome_cliente} </strong>  <br /> Representante de: <strong> {contratoSelecionado.negocio_cliente} </strong> </p>
                            <div style={{ marginBottom: "8px" }}>
                                <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>Data:</label>
                                <input
                                    type="date"
                                    value={contratoSelecionado.data_assinatura_cliente || ""}
                                    onChange={e => {
                                        const novaData = e.target.value;
                                        setContratoSelecionado({
                                            ...contratoSelecionado,
                                            data_assinatura_cliente: novaData
                                        });
                                        salvarData(contratoSelecionado.id, "data_assinatura_cliente", novaData);
                                    }}
                                    className="input-data-assinatura"
                                    style={{
                                        padding: "6px",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        marginTop: "4px",
                                        width: "160px"
                                    }}
                                />
                            </div>

                            {contratoSelecionado.LOGO_ASSINATURA_CLIENTE ? (
                                <>
                                    <img
                                        src={contratoSelecionado.LOGO_ASSINATURA_CLIENTE}
                                        className="img-assinatura"
                                        alt="Assinatura cliente"
                                    />

                                    <button
                                        className="btn-reassinar"
                                        onClick={() => {
                                            setContratoSelecionado({
                                                ...contratoSelecionado,
                                                LOGO_ASSINATURA_CLIENTE: null
                                            });
                                            abrirAssinatura("cliente");
                                        }}

                                    >
                                        Reassinar
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-assinar"
                                    onClick={() => abrirAssinatura("cliente")}
                                >
                                    Assinar
                                </button>

                            )}
                        </div>

                    </div>


                    <p className="codigo-final">
                        Código interno do contrato:{" "}
                        <a
                            href={`/contrato/${contratoSelecionado.codigo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-codigo"
                        >
                            {contratoSelecionado.codigo}
                        </a>

                    </p>

                    <button
                        className="btn-copiar-profissional"
                        onClick={() => {
                            const link = `${window.location.origin}/contrato/${contratoSelecionado.codigo}`;
                            const texto =
                                `Segue o link do seu contrato digital da Iron Executions. Nele você encontra as informações do projeto, prazos e condições acordadas.

Contrato: ${link}

Estou à disposição para qualquer dúvida.
`;

                            navigator.clipboard.writeText(texto);
                            alert("Texto profissional copiado com sucesso.");
                        }}
                    >
                        Copiar mensagem profissional
                    </button>

                </div>
            )
            }


            {modo === "novo" && (
                <>
                    <button
                        className="btn-voltar"
                        onClick={() => {
                            setEditandoId(null);
                            setModo("menu");
                        }}
                    >
                        Voltar
                    </button>

                    <NovoContrato
                        voltar={() => {
                            setEditandoId(null);
                            setModo("menu");
                        }}
                        editando={editandoId}
                    />
                </>
            )}


        </div >
    );
}
