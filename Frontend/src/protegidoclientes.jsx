import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtegidoClientes({ children }) {
    let cliente = null;

    try {
        cliente =
            JSON.parse(localStorage.getItem("cliente")) ||
            JSON.parse(localStorage.getItem("clientes"));
    } catch {
        cliente = null;
    }

    if (!cliente || !cliente.id) {
        return <Navigate to="/" replace />;
    }

    return children;
}
