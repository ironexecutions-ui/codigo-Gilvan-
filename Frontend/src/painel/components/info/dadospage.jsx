import React, { useState } from "react";
import HeaderAdmin from "../headeradmin";
import ContratosAdmin from "./rotas/contratosadmin";

export default function DadosPage() {

    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    const [modoContrato, setModoContrato] = useState("menu");

    return (
        <div style={{ height: "100vh" }}>

            {(modoContrato === "novo" || modoContrato === "ver")
                ? null
                : <HeaderAdmin funcionario={funcionario} />
            }

            <div style={{ padding: "20px" }}>
                <ContratosAdmin onModoChange={setModoContrato} />
            </div>

        </div>
    );
}
