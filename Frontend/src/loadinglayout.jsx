import React from "react";
import "./loadinglayout.css";
import logo from "../favicon.png";

export default function LoadingLayout() {
    return (
        <div className="load-container">

            <div className="load-backlight" />

            <div className="load-center">

                {/* container circular com anel externo */}
                <div className="load-image-wrapper">
                    <div className="load-image-ring"></div>
                    <img src={logo} alt="Iron Executions" className="load-logo-img" />
                </div>

                <h1 className="load-nome">
                    Iron<span>Executions</span>
                </h1>

                <p className="load-texto">
                    Preparando seu ambiente profissional
                </p>

            </div>
        </div>
    );
}
