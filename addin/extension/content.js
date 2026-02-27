// content.js — runs on https://mail.google.com/*
// Extracts sender + body from the open email, stores in session storage,
// and injects the ⚡ coach button into the Gmail reading pane.

(function () {
    "use strict";

    // ── Email context extraction ────────────────────────────────────────────────
    // Gmail uses different class names across versions; try all known variants.

    // Try every known Gmail selector for the sender email address.
    // Gmail obfuscates class names but a few structural attributes stay stable.
    function getSenderEmail() {
        // 1. Any element with an `email` attribute containing @
        const byAttr = document.querySelectorAll("[email]");
        for (const el of byAttr) {
            const v = el.getAttribute("email");
            if (v && v.includes("@")) return v;
        }

        // 2. data-hovercard-id that looks like an email
        const byHover = document.querySelectorAll("[data-hovercard-id]");
        for (const el of byHover) {
            const v = el.getAttribute("data-hovercard-id");
            if (v && v.includes("@")) return v;
        }

        // 3. data-email attribute (some Gmail versions)
        const byDataEmail = document.querySelectorAll("[data-email]");
        for (const el of byDataEmail) {
            const v = el.getAttribute("data-email");
            if (v && v.includes("@")) return v;
        }

        // 4. Aria-label on sender spans e.g. aria-label="from@example.com"
        const byAria = document.querySelectorAll("[aria-label]");
        for (const el of byAria) {
            const v = el.getAttribute("aria-label") ?? "";
            const match = v.match(/[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i);
            if (match) return match[0];
        }

        // 5. Any visible text node that looks like an email inside .nH (reading pane)
        const pane = document.querySelector(".nH") || document.body;
        const walker = document.createTreeWalker(
            pane, NodeFilter.SHOW_TEXT, null
        );
        const emailRe = /[\w.+\-]+@[\w.\-]+\.[a-z]{2,}/i;
        let node;
        while ((node = walker.nextNode())) {
            const match = node.textContent.match(emailRe);
            if (match && !match[0].includes("google.com") && !match[0].includes("gstatic")) {
                return match[0];
            }
        }

        return "";
    }

    function getEmailBody() {
        const el =
            document.querySelector(".a3s.aiL") ||
            document.querySelector(".ii.gt .a3s") ||
            document.querySelector(".ii.gt div") ||
            document.querySelector("[data-message-id]");
        return el ? (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 1500) : "";
    }

    function isEmailOpen() {
        // We're inside a specific email when the URL contains a long hash segment
        // e.g. /#inbox/FMfcgzQXKhqNxyzAbc  or /#label/Inbox/FMfcg...
        return /[#/][a-zA-Z0-9_-]{10,}$/.test(location.hash) || getSenderEmail() !== "";
    }

    // Guard: returns false if the extension was reloaded and this content script
    // is now orphaned. All chrome.* calls will throw if context is invalid.
    function isContextValid() {
        try { return !!chrome.runtime?.id; } catch { return false; }
    }

    function pushContext() {
        const senderEmail = getSenderEmail();
        const body = getEmailBody();
        if (senderEmail && isContextValid()) {
            try {
                chrome.storage.local.set({ emailContext: { senderEmail, body } });
            } catch (e) {
                console.warn("[SalesCoach] storage.set failed (context invalidated)");
            }
        }
        return { senderEmail, body };
    }

    // ── Button injection ────────────────────────────────────────────────────────

    function findToolbar() {
        // Target ONLY the reading pane toolbar — not the inbox list bar.
        // The reading pane wraps in .nH > .no and its action bar is .hq or .G-atb.
        // We look for the actions row that contains the reply/forward buttons.
        return (
            document.querySelector(".ade") ||   // newest Gmail reading pane header
            document.querySelector(".G-atb") ||   // classic reading pane toolbar
            document.querySelector(".hq")         // thread action bar
        );
    }

    let lastToolbar = null; // track which toolbar we injected into

    function injectButton() {
        const toolbar = findToolbar();
        if (!toolbar) return;

        // If the toolbar is the same element and button already inside — done
        if (toolbar === lastToolbar && toolbar.querySelector("#sales-coach-btn")) return;

        // Remove any stale button from old toolbar
        document.querySelectorAll("#sales-coach-btn").forEach(el => el.remove());

        lastToolbar = toolbar;

        const btn = document.createElement("div");
        btn.id = "sales-coach-btn";
        btn.title = "Sales Coach AI";
        btn.style.cssText = [
            "display:inline-flex !important",
            "align-items:center !important",
            "gap:5px",
            "cursor:pointer !important",
            "pointer-events:auto !important",
            "position:relative",
            "z-index:9999",
            "padding:4px 12px",
            "margin:0 6px",
            "border-radius:16px",
            "background:#0f6cbd !important",
            "color:#fff !important",
            "font-size:12px",
            "font-weight:600",
            "font-family:Google Sans,Roboto,sans-serif",
            "user-select:none",
            "white-space:nowrap",
            "box-shadow:0 1px 3px rgba(0,0,0,.25)",
            "vertical-align:middle",
            "line-height:24px",
            "opacity:1 !important",
        ].join(";");
        btn.innerHTML = "&#9889; Coach";

        // Debounce: ignore clicks within 500ms of last click
        let lastClick = 0;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClick < 500) return;
            lastClick = now;

            if (!isContextValid()) {
                console.warn("[SalesCoach] extension context invalidated — please refresh the Gmail tab.");
                return;
            }

            const { senderEmail, body } = pushContext();
            console.log("[SalesCoach] opening panel, sender:", senderEmail || "(none)");

            try {
                chrome.runtime.sendMessage(
                    { action: "openSidePanel", senderEmail, body },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn("[SalesCoach] sendMessage error:", chrome.runtime.lastError.message);
                        }
                    }
                );
            } catch (e) {
                console.warn("[SalesCoach] sendMessage threw (context invalidated) — refresh the tab.");
            }
        });

        toolbar.appendChild(btn);
    }

    // ── Persistent polling loop ─────────────────────────────────────────────────
    // Gmail aggressively re-renders. Instead of relying solely on URL change,
    // poll every 800ms: check if we're viewing an email, push context, keep button alive.

    let lastUrl = location.href;
    let tickInterval = null;

    function tick() {
        // Stop polling if the extension context has been invalidated (after reload)
        if (!isContextValid()) {
            clearInterval(tickInterval);
            document.querySelectorAll("#sales-coach-btn").forEach(el => el.remove());
            return;
        }

        const url = location.href;

        if (url !== lastUrl) {
            // URL changed — new email or inbox navigation
            lastUrl = url;
            // Give Gmail a moment to render the new view
            setTimeout(() => {
                const { senderEmail, body } = pushContext();
                if (senderEmail && isContextValid()) {
                    try {
                        chrome.storage.local.set({ emailContext: { senderEmail, body } });
                    } catch { /* context gone */ }
                }
                injectButton();
            }, 900);
        } else {
            // Same URL — just make sure button is still there if email is open
            injectButton();
        }
    }

    tickInterval = setInterval(tick, 800);

    // Kick off immediately after a short delay for initial page load
    setTimeout(() => {
        pushContext();
        injectButton();
    }, 1500);

    // ── Insert reply via chrome.runtime message (from sidepanel → background → here) ─

    try {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type !== "SALES_COACH_INSERT_REPLY") return;
            insertReplyText(message.text ?? "");
        });
    } catch { /* context invalidated */ }

    function insertReplyText(text) {
        const replyBtn =
            document.querySelector('[data-tooltip="Reply"]') ||
            document.querySelector('span[data-tooltip="Reply"]') ||
            document.querySelector(".aaq .T-I");
        if (replyBtn) replyBtn.click();

        setTimeout(() => {
            const compose =
                document.querySelector(".Am.Al.editable") ||
                document.querySelector('[contenteditable="true"].Am') ||
                document.querySelector(".editable[contenteditable='true']");
            if (compose) {
                compose.focus();
                document.execCommand("insertText", false, text);
            }
        }, 700);
    }
})();
