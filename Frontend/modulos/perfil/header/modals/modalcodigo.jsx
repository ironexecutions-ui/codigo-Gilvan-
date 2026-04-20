import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import "./modalcodigo.css";

export default function ModalCodigo({ codigo, fechar }) {

    const svgRef = useRef(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, codigo, {
                format: "CODE128",
                width: 2,
                height: 90,
                displayValue: false
            });
        }
    }, [codigo]);

    return (
        <div className="cod-modal-fundo">
            <div className="cod-modal-caixa">

                <h2 className="cod-titulo">Código de Barras</h2>

                <div className="cod-barcode-box">
                    <svg ref={svgRef} className="cod-barcode-svg"></svg>
                </div>

                <button className="cod-btn-fechar" onClick={fechar}>
                    Fechar
                </button>
            </div>
        </div>
    );
}
