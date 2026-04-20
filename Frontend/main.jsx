import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App.jsx";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { LoadingProvider } from "./src/loadingcontext.jsx";

// ===============================
// REGISTRO DO SERVICE WORKER (PWA)
// ===============================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
      })
      .catch(err => {
        console.log("Erro ao registrar Service Worker", err);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="id de google aqui">
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
