import React from "react";
import HeaderAdmin from "../headeradmin";
import ClientesAdmin from "./rotas/clientesadmin";

export default function ClientesPage() {

    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    return (
        <div >

            <HeaderAdmin funcionario={funcionario} />

            <div style={{ padding: "20px" }}>
                <ClientesAdmin />
            </div>

        </div>
    );
}
