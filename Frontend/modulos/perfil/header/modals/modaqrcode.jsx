import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./modalqrcode.css";

export default function ModalQrcode({ qrcode, fechar }) {
    return (
        <div className="cd-modal-fundo">
            <div className="cd-modal-caixa">

                <h2 className="cd-titulo">QR Code</h2>

                <div className="cd-qrcode-conteudo">
                    <QRCodeCanvas
                        value={qrcode}
                        size={180}
                        bgColor="#FFFFFF"
                        fgColor="#05012bff"
                        level="H"
                    />
                </div>

                <button className="cd-btn-fechar" onClick={fechar}>
                    Fechar
                </button>

            </div>
        </div>
    );
}
