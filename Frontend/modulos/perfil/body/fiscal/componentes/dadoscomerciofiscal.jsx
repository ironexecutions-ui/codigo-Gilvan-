import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../../config";
import "./dadoscomerciofiscal.css";
import UploadCertificadoA1 from "./uploadcertificadoa1";

export default function DadosComerciaisFiscal() {

    const [dados, setDados] = useState(null);
    const [editando, setEditando] = useState(null);
    const [valorTemp, setValorTemp] = useState("");

    const [funcao, setFuncao] = useState(null);
    const [bloqueado, setBloqueado] = useState(false);

    const token = localStorage.getItem("token");

    /* ===============================
       VERIFICAR FUNÇÃO DO USUÁRIO
    =============================== */
    useEffect(() => {
        fetch(`${API_URL}/clientes/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(dados => {
                if (
                    dados.funcao !== "Administrador(a)" &&
                    dados.funcao !== "Administradora"
                ) {
                    setBloqueado(true);
                } else {
                    setFuncao(dados.funcao);
                }
            })
            .catch(() => setBloqueado(true));
    }, []);

    /* ===============================
       CARREGAR DADOS DO COMÉRCIO
    =============================== */
    useEffect(() => {
        if (!funcao) return;

        carregar();
    }, [funcao]);

    function carregar() {
        fetch(`${API_URL}/fiscal/comercio`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => {
                if (r.status === 403) {
                    throw new Error("Sem permissão");
                }
                return r.json();
            })
            .then(setDados)
            .catch(() => {
                setBloqueado(true);
            });
    }

    function salvar(tabela, campo, valor) {
        fetch(`${API_URL}/fiscal/comercio/salvar-campo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ tabela, campo, valor })
        })
            .then(r => {
                if (r.status === 403) {
                    throw new Error("Sem permissão");
                }
                return r.json();
            })
            .then(() => carregar())
            .catch(() => {
                alert("Acesso restrito ao administrador");
            });
    }

    if (bloqueado) {
        return (
            <div className="dados-comercio-bloqueado">
                <h4>Acesso restrito</h4>
                <p>Somente administradores podem acessar dados fiscais do comércio.</p>
            </div>
        );
    }

    if (!dados) {
        return <p>Carregando dados comerciais...</p>;
    }

    function Campo({ tabela, campo, label, value, datalist, type = "text" }) {

        const estaEditando = editando === `${tabela}.${campo}`;

        function iniciarEdicao() {
            setEditando(`${tabela}.${campo}`);
            setValorTemp(value || "");
        }

        function finalizar() {
            setEditando(null);
            if (valorTemp !== value) {
                salvar(tabela, campo, valorTemp);
            }
        }

        return (
            <div className="campo-inline">
                <label>{label}</label>

                {!estaEditando && (
                    <p
                        className="campo-visual"
                        onClick={iniciarEdicao}
                    >
                        {value || "Clique para editar"}
                    </p>
                )}

                {estaEditando && (
                    <input
                        type={type}
                        list={datalist}
                        value={valorTemp}
                        autoFocus
                        onChange={e => setValorTemp(e.target.value)}
                        onBlur={finalizar}
                        onKeyDown={e => e.key === "Enter" && finalizar()}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="dados-comercio">

            <h4>Dados do Comércio</h4>

            <Campo tabela="comercios_cadastradas" campo="loja" label="Nome da loja" value={dados.comercio.loja} />
            <Campo tabela="comercios_cadastradas" campo="cnpj" label="CNPJ" value={dados.comercio.cnpj} />
            <Campo tabela="comercios_cadastradas" campo="cep" label="CEP" value={dados.comercio.cep} />
            <Campo tabela="comercios_cadastradas" campo="cidade" label="Cidade" value={dados.comercio.cidade} />

            <h4>Dados Fiscais</h4>

            <Campo tabela="fiscal_dados_comercio" campo="razao_social" label="Razão Social" value={dados.fiscal.razao_social} />
            <Campo tabela="fiscal_dados_comercio" campo="nome_fantasia" label="Nome Fantasia" value={dados.fiscal.nome_fantasia} />
            <Campo tabela="fiscal_dados_comercio" campo="inscricao_estadual" label="Inscrição Estadual" value={dados.fiscal.inscricao_estadual} />
            <Campo tabela="fiscal_dados_comercio" campo="cnae" label="CNAE" value={dados.fiscal.cnae} />
            <Campo
                tabela="fiscal_dados_comercio"
                campo="codigo_municipio"
                label="Código do Município (IBGE)"
                value={dados.fiscal.codigo_municipio}
            />

            <Campo
                tabela="fiscal_dados_comercio"
                campo="inscricao_municipal"
                label="Inscrição Municipal"
                value={dados.fiscal.inscricao_municipal}
            />

            <Campo
                tabela="fiscal_dados_comercio"
                campo="regime_tributario"
                label="Regime Tributário"
                value={dados.fiscal.regime_tributario}
                datalist="regimes"
            />

            <Campo
                tabela="fiscal_dados_comercio"
                campo="crt"
                label="CRT"
                value={dados.fiscal.crt}
                datalist="crt"
            />

            <h4>Segurança Fiscal</h4>

            <UploadCertificadoA1 onSucesso={carregar} />

            <Campo tabela="fiscal_dados_comercio" campo="csc_id" label="ID do CSC" value={dados.fiscal.csc_id} />
            <Campo tabela="fiscal_dados_comercio" campo="csc_token" label="CSC Token" value={dados.fiscal.csc_token} />

            <h4>Configuração de Emissão NFC-e</h4>

            <Campo
                tabela="fiscal_dados_comercio"
                campo="ambiente_emissao"
                label="Ambiente de Emissão"
                value={dados.fiscal.ambiente_emissao}
                datalist="ambientes"
            />

            <Campo tabela="fiscal_dados_comercio" campo="serie_nfce" label="Série NFC-e" value={dados.fiscal.serie_nfce} />
            <Campo tabela="fiscal_dados_comercio" campo="numero_inicial_nfce" label="Número Inicial NFC-e" value={dados.fiscal.numero_inicial_nfce} type="number" />

            <datalist id="regimes">
                <option value="Simples Nacional" />
                <option value="Lucro Presumido" />
                <option value="Lucro Real" />
            </datalist>

            <datalist id="crt">
                <option value="1" />
                <option value="2" />
                <option value="3" />
            </datalist>

            <datalist id="ambientes">
                <option value="homologacao" />
                <option value="producao" />
            </datalist>

        </div>
    );
}
