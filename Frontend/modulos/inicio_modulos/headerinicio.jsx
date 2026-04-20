import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../../config";
import "./headerinicio.css";

export default function HeaderInicio() {

    const location = useLocation();

    const [dados, setDados] = useState({
        loja: "",
        imagem: "",
        email: "",
        celular: ""
    });

    const [carregado, setCarregado] = useState(false);
    const [copiado, setCopiado] = useState(false);

    // lê slug da URL
    useEffect(() => {
        const slug = location.pathname
            .replace("", "")
            .replace(/^\/+/, "");

        if (slug) {
            carregar(slug);
        } else {
            carregar("");
        }
    }, [location.pathname]);

    function carregar(valorComTraco) {
        const valorReal = valorComTraco.replace(/-/g, " ");

        fetch(`${API_URL}/comercios/buscar?nome=${encodeURIComponent(valorReal)}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.loja) {
                    setDados({
                        loja: d.loja || "",
                        imagem: d.imagem || "",
                        email: d.email || "",
                        celular: d.celular || ""
                    });
                    setCarregado(true);
                } else {
                    carregarPadrao();
                }
            })
            .catch(() => carregarPadrao());
    }

    function carregarPadrao() {
        fetch(`${API_URL}/comercios/buscar`)
            .then(r => r.json())
            .then(d => {
                setDados({
                    loja: d.loja || "",
                    imagem: d.imagem || "",
                    email: d.email || "",
                    celular: d.celular || ""
                });
                setCarregado(true);
            })
            .catch(() => setCarregado(true));
    }

    function copiarEmail() {
        navigator.clipboard.writeText(dados.email);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    function abrirWhatsapp() {
        const numeroLimpo = dados.celular.replace(/\D/g, "");
        const mensagem = encodeURIComponent(
            `Olá! Encontrei sua empresa pelo Iron Business e gostaria de mais informações.`
        );
        window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, "_blank");
    }

    return (
        <header className="header-inicio">

            {copiado && (
                <div className="header-toast">
                    Email copiado para a área de transferência
                </div>
            )}

            {carregado && dados.loja && (
                <div className="header-container">

                    <div className="header-topo">
                        {dados.imagem ? (
                            <img
                                src={dados.imagem}
                                alt={dados.loja}
                                className="header-imagem"
                            />
                        ) : (
                            <div className="header-imagem placeholder">
                                {dados.loja.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <h1 className="header-nome">
                            {dados.loja}
                        </h1>
                    </div>

                    <div className="header-contatos">

                        <button
                            className="header-email"
                            onClick={copiarEmail}
                            title="Copiar email"
                        >
                            {dados.email}
                        </button>

                        <button
                            className="header-celular"
                            onClick={abrirWhatsapp}
                            title="Enviar mensagem no WhatsApp"
                        >
                            {dados.celular}
                        </button>

                    </div>

                </div>
            )}

        </header>
    );
}
