// background.js — MV3 Service Worker

// ── Keep-alive: ping every 20s so service worker doesn't sleep during demo ──
chrome.alarms.create("keepalive", { periodInMinutes: 0.3 });
chrome.alarms.onAlarm.addListener(() => { /* noop — just keeps worker alive */ });

// Open side panel when toolbar icon is clicked (starts in demo mode)
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
        console.error("[SalesCoach] action open failed:", err);
    });
});

// Content script sends context + openSidePanel action.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== "openSidePanel" || !sender.tab?.id) return false;

    const ctx = {
        senderEmail: message.senderEmail ?? "",
        body: message.body ?? "",
    };

    // Acknowledge immediately so Chrome doesn't log "port closed" error
    sendResponse({ ok: true });

    // sidePanel.open returns a Promise in Chrome 116+ (callback was removed)
    chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => {
            // Panel is open — broadcast context after a short delay so the
            // panel's runtime listener has time to register
            setTimeout(() => {
                chrome.runtime.sendMessage({ action: "emailContext", ...ctx }).catch(() => { });
            }, 400);
        })
        .catch((err) => {
            // This fires when user gesture context is lost (service worker just woke up).
            // User's next click will succeed since worker is now awake.
            console.warn("[SalesCoach] sidePanel.open failed (worker waking up):", err?.message ?? err);
        });

    return false; // sendResponse already called synchronously
});

