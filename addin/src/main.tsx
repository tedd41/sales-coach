import React from "react";
import ReactDOM from "react-dom/client";
import Taskpane from "./Taskpane";

const params = new URLSearchParams(window.location.search);
const gmailMode = params.get("platform") === "gmail";

function mount() {
  const root = document.getElementById("root")!;
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Taskpane gmailMode={gmailMode} />
    </React.StrictMode>,
  );
}

// Gmail side-panel: skip Office init entirely
if (gmailMode) {
  mount();
} else {
  // Outlook or standalone browser — Office.onReady is safe in both cases
  Office.onReady(() => mount());
}
