import React, { useState } from "react";
import "./formulariocurso.css";

export default function FormularioCadastro() {

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");

    function enviar(e) {
        e.preventDefault();

        if (!nome || !email) {
            alert("Preencha todos os campos");
            return;
        }

        const mensagem = `Olá, me chamo ${nome}.\nTenho interesse nas aulas de programação.\nMeu email para contato é: ${email}.`;

        const mensagemFormatada = encodeURIComponent(mensagem);

        const numero = "5511escolha um numero7818";

        const url = `https://wa.me/${numero}?text=${mensagemFormatada}`;

        window.open(url, "_blank");
    }

    return (
        <section id="formulario" className="formularioCadastro_container">

            <h2 className="formularioCadastro_titulo">
                Garanta sua vaga
            </h2>

            <form onSubmit={enviar} className="formularioCadastro_form">

                <input
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="formularioCadastro_input"
                />

                <input
                    type="email"
                    placeholder="Seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="formularioCadastro_input"
                />

                <button className="formularioCadastro_botao">
                    Quero participar
                </button>

            </form>

        </section>
    );
}