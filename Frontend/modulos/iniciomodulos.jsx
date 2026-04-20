import React from "react";
import { useLocation } from "react-router-dom";
import AreaLogin from "./inicio_modulos/arealogin";
import LojasAvaliacao from "./inicio_modulos/lojasavaliacao";
import Rodape from "./inicio_modulos/rodape";
import ExplicacaoModulos from "./inicio_modulos/explicacaomodulos";
import HeaderInicio from "./inicio_modulos/headerinicio";
import "./inicio-modulos.css";

export default function InicioModulos() {

    const location = useLocation();

    // extrai o slug depois de /ironbusiness
    // exemplos:
    // /ironbusiness                -> ""
    // /ironbusiness/iron-executions -> "iron-executions"
    const empresaSlug = location.pathname
        .replace("/", "")
        .replace(/^\/+/, "");

    function solicitarWhatsapp() {
        const numero = "5511escolha um numero7818";
        const mensagem = encodeURIComponent(
            "Olá! Gostaria de solicitar um sistema comercial."
        );
        window.open(`https://wa.me/${numero}?text=${mensagem}`, "_blank");
    }

    return (
        <div className="inicio-modulos-fundo">

            <HeaderInicio empresaInicial={empresaSlug} />


            <AreaLogin />

            <br />


            <LojasAvaliacao />
            <ExplicacaoModulos />
            <div className="inicio-modulos-whatsapp-float">
                <button
                    onClick={solicitarWhatsapp}
                    className="inicio-modulos-whatsapp-button"
                    aria-label="Solicitar sistema comercial via WhatsApp"
                >
                    <img
                        src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg"
                        alt="WhatsApp"
                        className="inicio-modulos-whatsapp-icon"
                    />
                </button>
            </div>
            <Rodape />
        </div>
    );
}
