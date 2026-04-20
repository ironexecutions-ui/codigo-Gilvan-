// Arquivo responsável pela URL padrão do backend
// Troca automática entre localhost e Render

const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

export const URL = isLocalhost
    ? "http://127.0.0.1:8889"
    : "https://ironexecutions-backend.onrender.com";
