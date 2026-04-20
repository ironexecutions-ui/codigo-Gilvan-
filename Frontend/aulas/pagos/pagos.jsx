import React, { useState } from "react";

import Lista from "./componentes/lista";
import Proximos from "./componentes/proximos";
import PagosRealizados from "./componentes/realizados";

import "./pagos.css";

export default function Pagos() {

    const [aba, setAba] = useState("lista");

    return (
        <div className="pagos_container">

            <div className="pagos_tabs">
                <button onClick={() => setAba("lista")} className={aba === "lista" ? "ativo" : ""}>
                    Lista
                </button>

                <button onClick={() => setAba("proximos")} className={aba === "proximos" ? "ativo" : ""}>
                    Próximos Pagos
                </button>

                <button onClick={() => setAba("pagos")} className={aba === "pagos" ? "ativo" : ""}>
                    Pagos
                </button>
            </div>

            {aba === "lista" && <Lista />}
            {aba === "proximos" && <Proximos />}
            {aba === "pagos" && <PagosRealizados />}

        </div>
    );
}