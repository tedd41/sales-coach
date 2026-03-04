import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Taskpane from "./Taskpane";

// Office.onReady ensures the Office JS runtime is initialised before we mount.
// Safe to call even when opened directly in a browser — it resolves immediately.
Office.onReady(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Taskpane />
    </React.StrictMode>,
  );
});
