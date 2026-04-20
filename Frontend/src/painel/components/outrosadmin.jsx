import React, { useEffect, useState } from "react";
import "./outrosadmin.css";
import { API_URL } from "../../../config";

export default function OutrosAdmin() {

    const [meses, setMeses] = useState([]);
    const [selecionado, setSelecionado] = useState(null);

    const [socios, setSocios] = useState([]);
    const [socioSelecionado, setSocioSelecionado] = useState(null);

    const [mostrarSocios, setMostrarSocios] = useState(false);

    // EMAIL CORRETO DO USUÁRIO
    const email = JSON.parse(localStorage.getItem("funcionario") || "{}").email;


    // ===========================
    // Formatar mês YYYY-MM
    // ===========================
    function formatarMes(mesString) {
        const [ano, mes] = mesString.split("-");
        const nomes = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return `${nomes[parseInt(mes) - 1]} ${ano}`;
    }


    // ===========================
    // Carregar ganhos do usuário
    // ===========================
    async function carregarGanhos() {
        try {
            const resp = await fetch(`${API_URL}/ganhos/mensais?email=${email}`);
            const dados = await resp.json();

            console.log("MEUS GANHOS:", dados);

            // apenas meses com ganho > 0
            setMeses(dados.filter(m => m.ganho_usuario > 0));

        } catch (err) {
            console.log("Erro ao carregar ganhos", err);
        }
    }


    // ===========================
    // Carregar ganhos dos sócios
    // ===========================
    async function carregarSocios() {
        try {
            const resp = await fetch(`${API_URL}/ganhos/socios`);
            const dados = await resp.json();

            // filtra meses zerados
            const arr = dados.map(s => ({
                ...s,
                meses: s.meses.filter(m => m.ganho_socio > 0)
            }));

            setSocios(arr);

        } catch (err) {
            console.log("Erro ao carregar socios", err);
        }
    }


    useEffect(() => {
        carregarGanhos();
        carregarSocios();
    }, []);



    return (
        <div className="oa-box">

            <h2 className="oa-titulo">Ganhos</h2>


            {/* BOTÕES DOS MESES */}
            <div className="oa-meses">
                {meses.length === 0 && (
                    <p className="oa-sem-ganhos">Nenhum ganho encontrado</p>
                )}

                {meses.length > 0 && meses.map((item, index) => (
                    <button
                        key={index}
                        className="oa-mes-botao"
                        onClick={() => setSelecionado(item)}
                    >
                        {formatarMes(item.mes)} ({item.ganho_usuario.toFixed(2)} R$)
                    </button>
                ))}
            </div>


            {/* DETALHES DO MÊS DO USUÁRIO */}
            {selecionado && (
                <div className="oa-detalhes">

                    <h3>Detalhes de {formatarMes(selecionado.mes)}</h3>

                    <p className="oa-usuario-info">
                        {selecionado.usuario} <br /> porcentagem {selecionado.porcentagem}% <br />
                        recebeu <strong>{selecionado.ganho_usuario.toFixed(2)} R$</strong>
                    </p>

                    <div className="oa-servicos-lista">
                        {selecionado.servicos?.map((s, i) => (
                            <div key={i} className="oa-servico">
                                <p><strong>Cliente:</strong> {s.cliente}</p>
                                <p><strong>Loja:</strong> {s.loja}</p>
                                <p><strong>Valor:</strong> {s.valor} R$</p>
                                <a href={s.link} target="_blank">Link</a>
                            </div>
                        ))}
                    </div>

                </div>
            )}



            {/* BOTÃO: VER GANHOS DOS SÓCIOS */}
            <button
                className="oa-socios-botao"
                onClick={() => setMostrarSocios(true)}
            >
                Ver ganhos dos outros sócios
            </button>



            {/* MODAL DOS SÓCIOS */}
            {mostrarSocios && (
                <div className="oa-modal">
                    <div className="oa-modal-conteudo">

                        <h3 className="oa-modal-titulo">Ganhos dos Sócios</h3>

                        {socios.map((s, i) => (
                            <div key={i} className="oa-socio-bloco">

                                <h4 className="oa-socio-nome">
                                    {s.socio} ({s.porcentagem}%)
                                </h4>

                                <div className="oa-meses-socio">
                                    {s.meses.map((m, idx) => (
                                        <button
                                            key={idx}
                                            className="oa-mes-botao"
                                            onClick={() =>
                                                setSocioSelecionado({
                                                    ...m,
                                                    nome: s.socio,
                                                    servicos: m.servicos ?? []
                                                })
                                            }
                                        >
                                            {formatarMes(m.mes)} ({m.ganho_socio.toFixed(2)} R$)
                                        </button>
                                    ))}
                                </div>

                            </div>
                        ))}

                        <button className="oa-fechar" onClick={() => setMostrarSocios(false)}>
                            Fechar
                        </button>

                    </div>
                </div>
            )}



            {/* DETALHES DO SÓCIO */}
            {socioSelecionado && (
                <div className="oa-detalhes">

                    <h3>
                        {socioSelecionado.nome}<br /> mês {formatarMes(socioSelecionado.mes)}
                    </h3>

                    <p className="oa-usuario-info">
                        Recebeu: <strong>{socioSelecionado.ganho_socio.toFixed(2)} R$</strong> <br />
                        porcentagem: <strong> {socioSelecionado.porcentagem}% </strong>
                    </p>

                    <div className="oa-servicos-lista">
                        {socioSelecionado?.servicos?.map((s, i) => (
                            <div key={i} className="oa-servico">
                                <p><strong>Cliente:</strong> {s.cliente}</p>
                                <p><strong>Loja:</strong> {s.loja}</p>
                                <p><strong>Valor:</strong> {s.valor} R$</p>
                                <a href={s.link} target="_blank">Link</a>
                            </div>
                        ))}
                    </div>

                </div>
            )}

        </div>
    );
}
