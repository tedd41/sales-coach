import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Outlook add-ins MUST be served over HTTPS even on localhost.
// basicSsl is only needed for the dev server — in production the Container App
// handles TLS termination, so we skip it in production builds.
// Tailwind v4 is wired up via PostCSS (postcss.config.js) — no Vite plugin needed.
const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  plugins: [react(), ...(isDev ? [basicSsl()] : [])],
  server: {
    port: 5174,
    // basicSsl plugin handles the self-signed cert — Outlook add-ins must be
    // served over HTTPS, and ngrok https expects a local HTTPS server.
    proxy: {
      // Forward /api calls server-side so the HTTPS add-in page never makes
      // mixed-content HTTP requests directly to the Express backend.
      "/api": "http://localhost:3001",
    },
    headers: {
      // Allow Chrome extension side panel to iframe this app
      "Content-Security-Policy": "frame-ancestors *",
      "X-Frame-Options": "ALLOWALL",
    },
    allowedHosts: ["unbarrable-undarned-karrie.ngrok-free.dev"],
  },
});
