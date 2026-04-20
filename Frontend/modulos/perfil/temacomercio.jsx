import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../../config";

const TemaComercioContext = createContext();
export function useTemaComercio() {
    return useContext(TemaComercioContext);
}

export function TemaComercioProvider({ children }) {
    const [tema, setTema] = useState({
        fundo: "",
        letraCor: "",
        letraTipo: "",
        carregado: false
    });

    useEffect(() => {
        async function carregar() {
            try {
                const respMe = await fetch(`${API_URL}/clientes/me`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                const cliente = await respMe.json();

                if (cliente && cliente.comercio_id) {
                    const respComercio = await fetch(
                        `${API_URL}/cadastro/comercio/${cliente.comercio_id}`
                    );

                    const comercio = await respComercio.json();

                    setTema({
                        fundo: comercio.fundo || "",
                        letraCor: comercio.letra_cor || "",
                        letraTipo: comercio.letra_tipo || "",
                        carregado: true
                    });
                } else {
                    setTema(t => ({ ...t, carregado: true }));
                }
            } catch (err) {
                setTema(t => ({ ...t, carregado: true }));
            }
        }

        carregar();
    }, []);

    return (
        <TemaComercioContext.Provider value={tema}>
            {children}
        </TemaComercioContext.Provider>
    );
}
