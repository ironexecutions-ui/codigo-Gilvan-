import React, { useState, useEffect } from "react";
import HeaderPerfil from "./header/headerperfil";
import Body from "./body/body";
import { TemaComercioProvider, useTemaComercio } from "./temacomercio";
import { API_URL } from "../../config";

export default function IronBusinessPerfil() {

    useEffect(() => {
        async function carregarDadosLoja() {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const h = { Authorization: "Bearer " + token };

                // pega cliente logado
                const cliente = await (await fetch(`${API_URL}/retorno/me`, { headers: h })).json();
                if (!cliente?.comercio_id) return;

                // pega dados do comercio
                const comercio = await (await fetch(`${API_URL}/cadastro/comercio/${cliente.comercio_id}`, { headers: h })).json();
                if (!comercio) return;

                // altera título da aba
                if (comercio.loja) {
                    document.title = comercio.loja;
                }

                // altera favicon
                if (comercio.imagem) {
                    atualizarFavicon(comercio.imagem);
                }

            } catch (err) {
                console.log("Erro ao carregar loja:", err);
            }
        }

        function atualizarFavicon(url) {
            let link = document.getElementById("favicon");

            if (!link) {
                link = document.createElement("link");
                link.id = "favicon";
                link.rel = "icon";
                link.type = "m/png";
                document.head.appendChild(link);

            }

            link.href = `${url}?v=${Date.now()}`;
        }

        carregarDadosLoja();
    }, []);

    return (
        <TemaComercioProvider>
            <TemaWrapper>
                <Painel />
            </TemaWrapper>
        </TemaComercioProvider>
    );
}

function TemaWrapper({ children }) {
    const tema = useTemaComercio();

    const estiloContainer = {
        minHeight: "100vh",
        padding: "20px",
        background: tema.fundo || "",
        color: tema.letraCor || "",
        fontFamily: tema.letraTipo || ""
    };

    return (
        <div style={estiloContainer}>
            <style>
                {`
                    .painel-tema * {
                        color: ${tema.letraCor || "inherit"};
                        font-family: ${tema.letraTipo || "inherit"};
                    }
                `}
            </style>

            <div className="painel-tema">
                {children}
            </div>
        </div>
    );
}
function Painel() {

    const [headerMinimizado, setHeaderMinimizado] = useState(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState(0);

    function atualizarHeader() {
        setHeaderRefreshKey(prev => prev + 1);
    }

    return (
        <>
            <HeaderPerfil
                minimizado={headerMinimizado}
                setMinimizado={setHeaderMinimizado}
                refreshKey={headerRefreshKey}
            />

            <div style={{ marginTop: "30px" }}>
                <Body
                    setHeaderMinimizado={setHeaderMinimizado}
                    atualizarHeader={atualizarHeader}
                />
            </div>
        </>
    );
}

