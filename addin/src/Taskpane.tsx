// @ts-nocheck — Office JS types live on window; optional chaining handles undefined
import React, { useEffect, useState } from "react";

// Relative URL — Vite proxies /api → http://localhost:3001 so the HTTPS
// add-in page never makes mixed-content requests to a plain HTTP backend.
const API = "/api/v1";

// ── Legacy constant removed ──────────────────────────────────────────────────
const _UNUSED = {
  _placeholder: null,
};
void _UNUSED;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Rep {
  id: string;
  name: string;
  email: string;
}

type Status =
  | "loading"
  | "unknown_rep"
  | "ready"
  | "generating"
  | "done"
  | "error";
type Platform = "outlook" | "gmail" | "demo";

interface Props {
  gmailMode?: boolean;
}

function detectPlatform(gmailMode: boolean): Platform {
  if (gmailMode) return "gmail";
  if (typeof Office !== "undefined" && Office?.context?.mailbox?.item)
    return "outlook";
  return "demo";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Taskpane({ gmailMode = false }: Props) {
  const [platform] = useState<Platform>(() => detectPlatform(gmailMode));
  const [status, setStatus] = useState<Status>("loading");
  const [rep, setRep] = useState<Rep | null>(null);
  const [allReps, setAllReps] = useState<Rep[]>([]);
  const [emailBody, setEmailBody] = useState("");
  const [draft, setDraft] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (platform === "outlook") initOutlook();
    else if (platform === "gmail") initGmail();
    else initDemo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init: Outlook ──────────────────────────────────────────────────────────

  function initOutlook() {
    const item = Office.context.mailbox.item;
    const senderEmail = item?.from?.emailAddress ?? "";

    item?.body?.getAsync(Office.CoercionType.Text, (result: any) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        setEmailBody((result.value ?? "").slice(0, 800).trim());
      }
    });

    lookupRepByEmail(senderEmail);
  }

  // ── Init: Gmail (sender + body come via URL params from side panel) ─────────

  function initGmail() {
    const params = new URLSearchParams(window.location.search);
    const senderEmail = decodeURIComponent(params.get("sender") ?? "");
    const body = decodeURIComponent(params.get("body") ?? "");

    if (senderEmail) {
      setEmailBody(body.slice(0, 800).trim());
      lookupRepByEmail(senderEmail);
    } else {
      // No context yet — fall through to demo mode
      initDemo();
    }
  }

  // ── Init: Demo (rep dropdown from backend) ─────────────────────────────────

  function initDemo() {
    fetch(`${API}/reps`)
      .then((r) => r.json())
      .then((json) => {
        const reps = (json.data ?? []) as Rep[];
        setAllReps(reps);
        if (reps.length > 0) setRep(reps[0]);
        setEmailBody("");
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Backend unreachable. Is the server running on :3001?");
      });
  }

  // ── Shared: look up rep by email ───────────────────────────────────────────

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
        setStatus("unknown_rep");
        setErrorMsg("Couldn't reach backend to check rep.");
      });
  }

  // ── Generate coaching draft ────────────────────────────────────────────────

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
      setErrorMsg("Generation failed — check backend console.");
    }
  }

  // ── Insert / copy reply ────────────────────────────────────────────────────

  function insertReply() {
    if (!draft) return;
    if (platform === "outlook") {
      Office.context.mailbox.item?.displayReplyForm({
        htmlBody: `<p>${draft.replace(/\n/g, "<br/>")}</p>`,
      });
    } else if (platform === "gmail") {
      window.parent.postMessage(
        { type: "SALES_COACH_INSERT_REPLY", text: draft },
        "*",
      );
    } else {
      navigator.clipboard.writeText(draft).catch(() => {});
      alert("Copied to clipboard!");
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  const BADGE: Record<Platform, { label: string; bg: string }> = {
    outlook: { label: "OUTLOOK", bg: "#0f6cbd" },
    gmail: { label: "GMAIL", bg: "#ea4335" },
    demo: { label: "DEMO", bg: "#ff8c00" },
  };
  const badge = BADGE[platform];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚡</span>
        <span style={styles.title}>Sales Coach</span>
        <span style={{ ...styles.badge, background: badge.bg }}>
          {badge.label}
        </span>
      </div>

      {/* States */}
      {status === "loading" && <p style={styles.muted}>Reading email…</p>}

      {status === "unknown_rep" && (
        <div style={styles.notice}>
          <p>Sender not found in the sales team roster.</p>
          <p style={styles.muted}>
            Only registered team members have coaching profiles.
          </p>
        </div>
      )}

      {status === "error" && (
        <div style={styles.errorBox}>{errorMsg || "Something went wrong."}</div>
      )}

      {/* Demo rep dropdown */}
      {platform === "demo" &&
        allReps.length > 0 &&
        (status === "ready" ||
          status === "generating" ||
          status === "done") && (
          <div>
            <label style={styles.label}>Select rep</label>
            <select
              style={styles.select}
              value={rep?.id ?? ""}
              onChange={(e) => {
                const r = allReps.find((x) => x.id === e.target.value);
                if (r) {
                  setRep(r);
                  setDraft("");
                  setStatus("ready");
                }
              }}
            >
              {allReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Active panel */}
      {(status === "ready" || status === "generating" || status === "done") &&
        rep && (
          <>
            {/* Rep card — Outlook / Gmail only */}
            {platform !== "demo" && (
              <div style={styles.repCard}>
                <div style={styles.repName}>{rep.name}</div>
                <div style={styles.repEmail}>{rep.email}</div>
              </div>
            )}

            <label style={styles.label}>Email content (editable)</label>
            <textarea
              style={styles.textarea}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={5}
              placeholder="Paste or edit the email here…"
            />

            <button
              style={{
                ...styles.btn,
                opacity: status === "generating" ? 0.6 : 1,
              }}
              onClick={generateDraft}
              disabled={status === "generating"}
            >
              {status === "generating"
                ? "Generating…"
                : "✦ Generate Coaching Reply"}
            </button>

            {status === "done" && draft && (
              <>
                <label style={styles.label}>Suggested reply</label>
                <textarea
                  style={{ ...styles.textarea, background: "#fff" }}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={10}
                />
                <button
                  style={{ ...styles.btn, ...styles.btnGreen }}
                  onClick={insertReply}
                >
                  {platform === "gmail"
                    ? "✉ Insert as Reply in Gmail"
                    : platform === "outlook"
                      ? "✉ Insert as Reply"
                      : "📋 Copy to Clipboard"}
                </button>
              </>
            )}
          </>
        )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: "100vh",
    background: "#f9f9f9",
    fontFamily: "'Segoe UI', 'Google Sans', Tahoma, sans-serif",
    boxSizing: "border-box",
  },
  header: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  logo: { fontSize: 20 },
  title: { fontSize: 16, fontWeight: 700, color: "#1a1a1a" },
  badge: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
    borderRadius: 4,
    padding: "2px 6px",
    letterSpacing: 0.5,
  },
  repCard: {
    background: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    border: "1px solid #e5e5e5",
  },
  repName: { fontWeight: 600, fontSize: 14, color: "#111" },
  repEmail: { fontSize: 12, color: "#666", marginTop: 2 },
  label: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: -4 },
  select: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 13,
    fontFamily: "inherit",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 13,
    fontFamily: "inherit",
    resize: "vertical",
    background: "#f5f5f5",
    boxSizing: "border-box",
  },
  btn: {
    background: "#0f6cbd",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  btnGreen: { background: "#107c10", marginTop: 4 },
  muted: { fontSize: 12, color: "#888" },
  notice: {
    fontSize: 13,
    color: "#555",
    background: "#fff8e1",
    border: "1px solid #ffe082",
    borderRadius: 6,
    padding: 12,
  },
  errorBox: {
    fontSize: 13,
    color: "#c00",
    background: "#fff0f0",
    border: "1px solid #fcc",
    borderRadius: 6,
    padding: 12,
  },
};
