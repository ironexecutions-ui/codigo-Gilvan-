import React from "react";
import { Navigate } from "react-router-dom";

export default function Protegido({ children }) {
    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    if (!funcionario || !funcionario.id) {
        return <Navigate to="/" replace />;
    }

    return children;
}
