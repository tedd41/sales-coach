import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Outlook add-ins MUST be served over HTTPS even on localhost
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5174,
    https: true,
    headers: {
      // Allow Chrome extension side panel to iframe this app
      "Content-Security-Policy": "frame-ancestors *",
      "X-Frame-Options": "ALLOWALL",
    },
  },
});
