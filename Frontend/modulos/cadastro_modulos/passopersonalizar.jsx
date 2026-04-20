import React, { useState, useEffect } from "react";
import "./passopersonalizar.css";

export default function Passo2Personalizar({ onContinuar, onPular }) {

    const [mostrarForm, setMostrarForm] = useState(false);

    const [fundo, setFundo] = useState("");
    const [letraTipo, setLetraTipo] = useState("");
    const [letraCor, setLetraCor] = useState("");

    // ⬇️ PULAR POR PADRÃO AO ENTRAR NO PASSO
    useEffect(() => {
        onPular();
    }, []);

    function enviar(e) {
        e.preventDefault();

        onContinuar({
            fundo: fundo || null,
            letra_tipo: letraTipo || null,
            letra_cor: letraCor || null
        });
    }

    return (
        <div className="passo2-container">

            <h3 className="titulo">Personalização do comércio</h3>

            {!mostrarForm && (
                <div className="botao-container">

                    <button
                        onClick={() => setMostrarForm(true)}
                        className="botao-verde"
                    >
                        Personalizar agora
                    </button>

                    <button
                        onClick={onPular}
                        className="botao-cinza"
                    >
                        Personalizar depois
                    </button>

                </div>
            )}

            {mostrarForm && (
                <>
                    <form onSubmit={enviar} className="formulario">

                        <label>Cor de fundo</label>
                        <input
                            type="color"
                            value={fundo}
                            onChange={e => setFundo(e.target.value)}
                            className="input-cor"
                        />

                        <label>Estilo de letra</label>
                        <select
                            value={letraTipo}
                            onChange={e => setLetraTipo(e.target.value)}
                            className="input-select"
                        >
                            <optgroup label="Modernas">
                                <option value="Montserrat">Montserrat</option>
                                <option value="Inter">Inter</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                                <option value="Nunito">Nunito</option>
                            </optgroup>

                            <optgroup label="Elegantes">
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Merriweather">Merriweather</option>
                                <option value="Libre Baskerville">Libre Baskerville</option>
                            </optgroup>

                            <optgroup label="Profissionais">
                                <option value="DM Sans">DM Sans</option>
                                <option value="Work Sans">Work Sans</option>
                                <option value="Source Sans 3">Source Sans 3</option>
                            </optgroup>
                        </select>

                        <div style={{ display: "none" }}>
                            <label>Cor da letra</label>
                            <input
                                type="color"
                                value={letraCor}
                                onChange={e => setLetraCor(e.target.value)}
                                className="input-cor"
                            />
                        </div>

                        <button
                            type="submit"
                            className="botao-verde"
                        >
                            Continuar
                        </button>
                    </form>

                    <div
                        className="preview-comercio"
                        style={{
                            backgroundColor: fundo,
                            fontFamily: `"${letraTipo}", system-ui, sans-serif`,
                            color: letraCor
                        }}
                    >
                        <h4>Exemplo de visual</h4>
                        <p>A cor de letra sera aplicada no sistema</p>
                        <button className="preview-botao">Botão de exemplo</button>
                    </div>
                </>
            )}

        </div>
    );
}
