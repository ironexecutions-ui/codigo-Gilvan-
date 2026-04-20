import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../config";
import RifaPreview from "./preview";
import "./rifa.css";

export default function Rifa() {
    const [autorizado, setAutorizado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [avisoIntervalo, setAvisoIntervalo] = useState("");

    const [rifas, setRifas] = useState([]);

    const [nomeRifa, setNomeRifa] = useState("");
    const [premio, setPremio] = useState("");
    const [inicio, setInicio] = useState(1);
    const [fim, setFim] = useState(100);
    const [preco, setPreco] = useState("");
    const [dataFim, setDataFim] = useState("");

    const [fotos, setFotos] = useState([]);
    const [urlsFotos, setUrlsFotos] = useState([]);

    const [erro, setErro] = useState("");
    const [ok, setOk] = useState("");
    const [avisoFim, setAvisoFim] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        verificarPermissao();
        carregarRifas();
    }, []);

    async function verificarPermissao() {
        try {
            const res = await fetch(`${API_URL}/clientes/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setAutorizado(json.funcao === "Administrador(a)");
        } catch {
            setAutorizado(false);
        } finally {
            setCarregando(false);
        }
    }

    async function carregarRifas() {
        try {
            const res = await fetch(`${API_URL}/rifa/listar`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            setRifas(json.rifas || []);
        } catch {
            setRifas([]);
        }
    }

    async function uploadFotos() {
        const urls = [];

        for (const foto of fotos) {
            const formData = new FormData();
            formData.append("arquivo", foto);
            formData.append("pasta", "rifas");

            const res = await fetch(`${API_URL}/upload/imagem`, {
                method: "POST",
                body: formData
            });

            const json = await res.json();

            if (!res.ok || !json.url) {
                throw new Error("Erro ao enviar imagem");
            }

            urls.push(json.url);
        }

        return urls;
    }

    async function salvarRifa(e) {
        e.preventDefault();
        setErro("");
        setOk("");

        if (!nomeRifa.trim()) {
            setErro("Informe o nome da rifa");
            return;
        }

        if (!premio.trim()) {
            setErro("Informe o prêmio da rifa");
            return;
        }

        if (inicio >= fim) {
            setErro("O número final deve ser maior que o inicial");
            return;
        }

        if (!preco || Number(preco) <= 0) {
            setErro("Informe um preço válido");
            return;
        }

        if (!dataFim) {
            setErro("Informe a data de finalização");
            return;
        }

        if (fotos.length === 0) {
            setErro("É obrigatório adicionar pelo menos uma imagem do prêmio");
            return;
        }

        try {
            let urls = [];

            if (fotos.length > 0) {
                urls = await uploadFotos();
            }



            const fotosString = urls.join("|");

            const res = await fetch(`${API_URL}/rifa/criar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: nomeRifa,
                    premio,
                    inicio,
                    fim,
                    preco,
                    data_fim: dataFim,
                    fotos: fotosString
                })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.detail || "Erro ao salvar rifa");
            }

            setOk("Rifa criada com sucesso");

            setNomeRifa("");
            setPremio("");
            setInicio(1);
            setFim(100);
            setPreco("");
            setDataFim("");
            setFotos([]);
            setUrlsFotos([]);

            carregarRifas();
        } catch (err) {
            setErro(err.message);
        }
    }

    if (carregando) return <p className="carregando-rifa">Carregando...</p>;

    if (!autorizado) {
        return (
            <div className="rifa-bloqueado">
                <h3>Acesso não autorizado</h3>
                <p>Somente administradores podem acessar este módulo.</p>
            </div>
        );
    }

    return (
        <div className="rifa-container">
            <h3>Registro de Rifa</h3>

            <form onSubmit={salvarRifa} className="rifa-form">
                <label>
                    Nome da rifa<span className="obrigatorio" >*</span>
                    <input
                        type="text"
                        value={nomeRifa}
                        onChange={e => setNomeRifa(e.target.value)}
                    />
                </label>

                <label>
                    Prêmio<span className="obrigatorio" >*</span>
                    <input
                        type="text"
                        value={premio}
                        onChange={e => setPremio(e.target.value)}
                    />
                </label>



                <div
                    className="rifa-dropzone"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const arquivos = Array.from(e.dataTransfer.files).filter(f =>
                            f.type.startsWith("image/")
                        );
                        setFotos(prev => [...prev, ...arquivos]);
                    }}
                    onClick={() => document.getElementById("input-fotos-rifa").click()}
                >
                    <p>Arraste as imagens aqui ou clique para selecionar <span className="obrigatorio" >*</span></p>
                </div>

                <input
                    id="input-fotos-rifa"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => {
                        const arquivos = Array.from(e.target.files);
                        setFotos(prev => [...prev, ...arquivos]);
                    }}
                />

                {fotos.length > 0 && (
                    <div className="rifa-preview-fotos">
                        {fotos.map((foto, index) => (
                            <img
                                key={index}
                                src={URL.createObjectURL(foto)}
                                alt={`foto-${index}`}
                            />
                        ))}
                    </div>
                )}


                <label>
                    Número inicial<span className="obrigatorio" >*</span>
                    <input
                        type="number"
                        value={inicio}
                        onChange={e => {
                            const valor = Number(e.target.value);

                            if (valor > fim) {
                                setInicio(fim);
                                setAvisoIntervalo("O número inicial não pode ser maior que o número final");
                                return;
                            }

                            setAvisoIntervalo("");
                            setInicio(valor);
                        }}
                    />
                </label>

                <label>
                    Número final<span className="obrigatorio" >*</span>
                    <input
                        type="number"
                        value={fim}
                        max={150}
                        onChange={e => {
                            const valor = Number(e.target.value);

                            if (valor > 150) {
                                setFim(150);
                                setAvisoIntervalo("O número final máximo permitido é 150");
                                return;
                            }

                            if (valor < inicio) {
                                setFim(inicio);
                                setAvisoIntervalo("O número final não pode ser menor que o número inicial");
                                return;
                            }

                            setAvisoIntervalo("");
                            setFim(valor);
                        }}
                    />
                </label>

                {avisoIntervalo && <p className="aviso">{avisoIntervalo}</p>}

                {avisoFim && <p className="aviso">{avisoFim}</p>}


                <label>
                    Preço por número (R$)<span className="obrigatorio" >*</span>
                    <input
                        type="number"
                        step="0.01"
                        value={preco}
                        onChange={e => setPreco(e.target.value)}
                    />
                </label>

                <label>
                    Data de finalização<span className="obrigatorio" >*</span>
                    <input
                        type="datetime-local"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                    />
                </label>

                <button type="submit">Salvar Rifa</button>

                {erro && <p className="erro">{erro}</p>}
                {ok && <p className="ok">{ok}</p>}
            </form>

            <RifaPreview rifas={rifas} />
        </div>
    );
}
