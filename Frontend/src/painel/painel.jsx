import React, { useState } from "react";
import HeaderAdmin from "./components/headeradmin";

import InfoAdmin from "./components/infoadmin";
import ServicosAdmin from "./components/servicosadmin";
import OutrosAdmin from "./components/outrosadmin";

import ServicosAdminIB from "./components/servicosadminib";
import OutrosAdminIB from "./components/outrosadminib";

import "./painel.css";

export default function Painel() {

    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    const [modo, setModo] = useState("servicos");

    if (!funcionario) {
        return <p style={{ padding: "40px" }}>Nenhum funcionário logado.</p>;
    }

    return (
        <div className="pa-grid">

            <div className="pa-header">
                <HeaderAdmin
                    funcionario={funcionario}
                    modo={modo}
                    setModo={setModo}
                />
            </div>

            {/* MODO SERVIÇOS */}
            {modo === "servicos" && (
                <>
                    <div className="pa-info">
                        <InfoAdmin />
                    </div>

                    <div className="pa-serv">
                        <ServicosAdmin />
                    </div>
                    <div className="pa-outros">
                        <ServicosAdminIB />
                    </div>
                </>
            )}

            {/* MODO IRONBUSINESS */}
            {modo === "ib" && (
                <>
                    <div className="pa-info">
                        <InfoAdmin />
                    </div>


                    {/*
                    <div  className="pa-outros">
                        <OutrosAdmin />
                    </div> <div className="pa-outros">
                        <OutrosAdminIB />
                    </div> */}

                </>
            )}

        </div>
    );
}
