// @ts-nocheck — Office JS types live on window.Office; optional chaining guards all access.
import React, { useEffect, useRef, useState } from "react";
import type { Rep, Status, Length, Tone } from "./types";
import { Spinner } from "./components/Spinner";
import { StatusCard } from "./components/StatusCard";
import { DraftCard } from "./components/DraftCard";
import { RefinePanel } from "./components/RefinePanel";

const API = "/api/v1";

export default function Taskpane() {
  const [status, setStatus] = useState<Status>("loading");
  const [rep, setRep] = useState<Rep | null>(null);
  const [draft, setDraft] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [length, setLength] = useState<Length>("original");
  const [tone, setTone] = useState<Tone>("original");
  const [customInstructions, setCustomInstructions] = useState("");
  // Refs hold context data for logging — never shown in the UI
  const emailBodyRef = useRef("");
  const senderEmailRef = useRef("");
  const managerNameRef = useRef("");

  useEffect(() => {
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    const item = Office?.context?.mailbox?.item;

    if (!item) {
      setStatus("no_item");
      return;
    }

    senderEmailRef.current = item?.from?.emailAddress ?? "";
    managerNameRef.current = Office?.context?.mailbox?.userProfile?.displayName ?? "";
    console.info("[SalesCoach] Sender:", senderEmailRef.current);
    console.info("[SalesCoach] Manager:", managerNameRef.current);

    item?.body?.getAsync(Office.CoercionType.Text, (result: any) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        emailBodyRef.current = (result.value ?? "").slice(0, 800).trim();
        console.info("[SalesCoach] Email body (truncated to 800):", emailBodyRef.current);
      }
      // Look up rep after we have the body (or after failure — still need the rep)
      lookupRepByEmail(senderEmailRef.current);
    });
  }

  // ── Rep lookup → immediately kick off generation ───────────────────────────

  function lookupRepByEmail(email: string) {
    fetch(`${API}/reps/by-email/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const foundRep = json.data as Rep;
          console.info("[SalesCoach] Rep found:", foundRep);
          setRep(foundRep);
          // Auto-kick generation — no button press needed
          generateDraft(foundRep, emailBodyRef.current);
        } else {
          console.warn("[SalesCoach] Sender not on roster:", email);
          setStatus("unknown_rep");
        }
      })
      .catch((err) => {
        console.error("[SalesCoach] Rep lookup failed:", err);
        setStatus("error");
        setErrorMsg("Couldn't reach the backend. Is the server running?");
      });
  }

  // ── Generate draft (auto-triggered, no user action needed) ────────────────

  async function generateDraft(
    repData: Rep,
    body: string,
    opts?: { length?: Length; tone?: Tone; customInstructions?: string },
  ) {
    setStatus("generating");
    console.info("[SalesCoach] Generating draft for rep:", repData.id, "body length:", body.length, opts ?? {});

    try {
      const res = await fetch(`${API}/intelligence/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repId: repData.id,
          latestUpdate: body,
          length: opts?.length ?? "original",
          tone: opts?.tone ?? "original",
          customInstructions: opts?.customInstructions ?? "",
          managerName: managerNameRef.current,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const message = json.data?.message ?? "No coaching reply generated.";
      console.info("[SalesCoach] Draft ready, length:", message.length);
      setDraft(message);
      setEditing(false);
      setStatus("done");
    } catch (err) {
      console.error("[SalesCoach] Draft generation failed:", err);
      setStatus("error");
      setErrorMsg("Draft generation failed — check backend console.");
    }
  }

  // ── Insert reply ──────────────────────────────────────────────────────────

  function insertReply() {
    if (!draft) return;
    console.info("[SalesCoach] Inserting reply into compose window");
    Office.context.mailbox.item?.displayReplyForm({
      htmlBody: `<p>${draft.replace(/\n/g, "<br/>")}</p>`,
    });
  }

  // ── Retry (error state) ───────────────────────────────────────────────────

  function retry() {
    setStatus("loading");
    setDraft("");
    setErrorMsg("");
    setRep(null);
    init();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f5f0ff] to-white font-[Segoe_UI,sans-serif]">
      <div className="flex-1 flex flex-col gap-4 px-5 pt-5 pb-6">

        {(status === "loading" || status === "generating") && (
          <Spinner message={status === "loading" ? "Reading email…" : "Drafting coaching reply…"} />
        )}

        {status === "no_item" && <StatusCard variant="no_item" />}
        {status === "unknown_rep" && <StatusCard variant="unknown_rep" />}
        {status === "error" && <StatusCard variant="error" message={errorMsg} onRetry={retry} />}

        {status === "done" && rep && draft && (
          <>
            <DraftCard
              draft={draft}
              editing={editing}
              onToggleEdit={() => setEditing((e) => !e)}
              onDraftChange={setDraft}
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={insertReply}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] transition-all shadow-sm shadow-purple-200 tracking-wide"
              >
                Insert as Reply
              </button>
              <button
                onClick={() => generateDraft(rep, emailBodyRef.current)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#6d28d9] border border-purple-200 hover:bg-purple-50 active:bg-purple-100 transition-colors tracking-wide"
              >
                Regenerate
              </button>
            </div>

            <RefinePanel
              open={refineOpen}
              onToggle={() => setRefineOpen((o) => !o)}
              length={length}
              tone={tone}
              customInstructions={customInstructions}
              onLengthChange={setLength}
              onToneChange={setTone}
              onCustomChange={setCustomInstructions}
              onApply={() => generateDraft(rep, emailBodyRef.current, { length, tone, customInstructions })}
            />
          </>
        )}

      </div>
    </div>
  );
}
