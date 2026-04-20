import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./app.css";
import "./app-responsivo.css";

import RifaCompras from "../public/rifas/rifacompras";
import InicioModulos from "../modulos/iniciomodulos";
import CadastroComercio from "../modulos/cadastrocomercio";
import IronBusinessPerfil from "../modulos/perfil/ironbusiness";
import ProtegidoClientes from "./protegidoclientes";
import { useLoading } from "./loadingcontext";
import { API_URL } from "../config";
import Horas from "../horas/horas"
import Aulas from "../aulas/aulas"
import Matricula from "../aulas/matricula/matricula";
import Perfil from "../aulas/perfil/perfil";
import Pagos from "..//aulas/pagos/pagos"
import Aula_pagamentos from "../aulas/pagamentos/aulas_pagamentos"

/* Mapa fixo de comercio_id -> imagem */



function RoteamentoComLoading() {
  const { setLoading } = useLoading();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/rifa-compras/:id?" element={<RifaCompras />} />

      <Route path="/cadastrocomercio" element={<CadastroComercio />} />
      <Route
        path="ironbusiness/perfil"
        element={
          <ProtegidoClientes>
            <IronBusinessPerfil />
          </ProtegidoClientes>
        }
      />
      <Route path="/*" element={<InicioModulos />} />
      <Route path="/parceria" element={<Horas />} />
      <Route path="/aulas" element={<Aulas />} />
      <Route path="/aulas/matricula" element={<Matricula />} />
      <Route path="/aulas/perfil" element={<Perfil />} />
      <Route path="/pagos" element={<Pagos />} />
      <Route path="/pagos/:id" element={<Aula_pagamentos />} />
    </Routes>
  );
}

export default function App() {
  const [fundoComercio, setFundoComercio] = useState(null);

  /* keep-alive backend */
  useEffect(() => {
    fetch("aqui precisa um link das notas fiscais", {
      method: "GET",
      mode: "no-cors"
    }).catch(() => { });
  }, []);

  /* detectar comercio logado e aplicar fundo */
  useEffect(() => {
    async function carregarFundo() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const r = await fetch(`${API_URL}/retorno/me`, {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        if (!r.ok) return;

        const usuario = await r.json();
        if (!usuario?.comercio_id) return;

        const imagem = FUNDOS_POR_COMERCIO[usuario.comercio_id];
        if (!imagem) return;

        setFundoComercio(imagem);

      } catch (e) {
        // silêncio intencional
      }
    }

    carregarFundo();
  }, []);

  return (
    <Router>
      <div
        className="app"
        style={
          fundoComercio
            ? {
              backgroundImage: "#ffffff00",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              minHeight: "100vh"
            }
            : undefined
        }
      >
        <RoteamentoComLoading />
      </div>
    </Router>
  );
}
