import './api/axios.js'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

async function start() {
  // Demo mode: كل طلبات /api بترد عليها بيانات وهمية من المتصفح نفسه
  if (import.meta.env.VITE_DEMO_MODE === "true") {
    const { worker } = await import("./demo/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>
  );
}

start();
