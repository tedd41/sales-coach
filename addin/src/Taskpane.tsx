// @ts-nocheck — Office JS types live on window.Office; optional chaining guards all access.
import React, { useEffect, useState } from "react";

const API = "/api/v1"; // Vite dev: proxied to http://localhost:3001 | prod: same origin (Express serves this build)

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Rep {
  id: string;
  name: string;
  email: string;
}

type Status = "loading" | "no_item" | "unknown_rep" | "ready" | "generating" | "done" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Taskpane() {
  const [status, setStatus] = useState<Status>("loading");
  const [rep, setRep] = useState<Rep | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [draft, setDraft] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // item is not available if the taskpane is opened with no email selected
    const item = Office?.context?.mailbox?.item;

    if (!item) {
      setStatus("no_item");
      return;
    }

    const senderEmail = item?.from?.emailAddress ?? "";

    item?.body?.getAsync(Office.CoercionType.Text, (result: any) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        setEmailBody((result.value ?? "").slice(0, 800).trim());
      }
    });

    lookupRepByEmail(senderEmail);
  }

  // ── Rep lookup ────────────────────────────────────────────────────────────

  function lookupRepByEmail(email: string) {
    fetch(`${API}/reps/by-email/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setRep(json.data);
          setStatus("ready");
        } else {
          setStatus("unknown_rep");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Couldn't reach the backend. Is the server running?");
      });
  }

  // ── Generate draft ────────────────────────────────────────────────────────

  async function generateDraft() {
    if (!rep?.id) return;
    setStatus("generating");
    setDraft("");

    try {
      const res = await fetch(`${API}/intelligence/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repId: rep.id, latestUpdate: emailBody }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDraft(json.data?.message ?? "No coaching reply generated.");
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMsg("Draft generation failed — check backend console.");
    }
  }

  // ── Insert reply ──────────────────────────────────────────────────────────

  function insertReply() {
    if (!draft) return;
    Office.context.mailbox.item?.displayReplyForm({
      htmlBody: `<p>${draft.replace(/\n/g, "<br/>")}</p>`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 gap-3 font-[Segoe_UI,sans-serif]">

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">⚡</span>
        <span className="text-base font-bold text-gray-900">Sales Coach</span>
        <span className="ml-auto text-[10px] font-bold text-white bg-[#0f6cbd] rounded px-1.5 py-0.5 tracking-wide">
          OUTLOOK
        </span>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <p className="text-xs text-gray-400">Reading email…</p>
      )}

      {/* No email open */}
      {status === "no_item" && (
        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          Open an email first, then click <strong>Sales Coach</strong>.
        </div>
      )}

      {/* Unknown rep */}
      {status === "unknown_rep" && (
        <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="font-semibold">Sender not on the roster</p>
          <p className="text-xs text-gray-500 mt-1">
            Only registered sales reps have coaching profiles.
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {errorMsg || "Something went wrong."}
        </div>
      )}

      {/* Active panel — rep found */}
      {(status === "ready" || status === "generating" || status === "done") && rep && (
        <>
          {/* Rep card */}
          <div className="bg-white rounded-lg border border-gray-200 px-3.5 py-2.5">
            <div className="text-sm font-semibold text-gray-900">{rep.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{rep.email}</div>
          </div>

          {/* Email body */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email content
            </label>
            <textarea
              className="w-full p-2.5 rounded-md border border-gray-200 text-sm bg-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={5}
              placeholder="Paste or edit the email content here…"
            />
          </div>

          {/* Generate button */}
          <button
            className="w-full py-2.5 rounded-md text-sm font-semibold text-white bg-[#0f6cbd] hover:bg-[#0d5ba3] disabled:opacity-60 transition-colors"
            onClick={generateDraft}
            disabled={status === "generating"}
          >
            {status === "generating" ? "Generating…" : "✦ Generate Coaching Reply"}
          </button>

          {/* Draft output */}
          {status === "done" && draft && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Suggested reply
              </label>
              <textarea
                className="w-full p-2.5 rounded-md border border-gray-200 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-green-400"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={10}
              />
              <button
                className="w-full py-2.5 rounded-md text-sm font-semibold text-white bg-[#107c10] hover:bg-[#0c5e0c] transition-colors"
                onClick={insertReply}
              >
                ✉ Insert as Reply
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
