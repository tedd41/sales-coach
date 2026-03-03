import { log } from "./logService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Core send function
//
// Power Automate flow is intentionally dumb — it receives this exact payload
// and fires Office 365 "Send an email (V2)". All logic lives here.
//
// Dev/prod gate: if NODE_ENV !== "production", to is replaced with DEV_EMAIL
// so we never accidentally email real reps during development.
//
// TODO: If the PA flow ever needs a specific From address, add a "from" field
//       to the payload and configure it in the PA HTTP trigger → Send email action.
// ---------------------------------------------------------------------------

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  const sendUrl = process.env.POWER_AUTOMATE_SEND_URL;

  if (!sendUrl) {
    log.warn(
      "emailService.sendEmail",
      "POWER_AUTOMATE_SEND_URL is not set — skipping send",
    );
    return;
  }

  let { to } = payload;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const devEmail = process.env.DEV_EMAIL;
    if (!devEmail) {
      log.warn(
        "emailService.sendEmail",
        "NODE_ENV is not production but DEV_EMAIL is not set — skipping send",
      );
      return;
    }
    const devRecipients = devEmail
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .join("; ");

    log.info(
      "emailService.sendEmail",
      `[DEV] Redirecting email from "${to}" → "${devRecipients}"`,
    );
    to = devRecipients;
  }

  const outboundPayload = { ...payload, to };

  const response = await fetch(sendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(outboundPayload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    throw new Error(
      `Power Automate send failed: HTTP ${response.status} — ${text}`,
    );
  }

  log.info("emailService.sendEmail", `Email sent to: ${to}`, {
    subject: payload.subject,
  });
}

// ---------------------------------------------------------------------------
// Daily update email template
// ---------------------------------------------------------------------------

export function buildDailyUpdateEmail(rep: {
  name: string;
  email: string;
}): SendEmailPayload {
  const firstName = rep.name.split(" ")[0];

  const body = `
<p>Hi ${firstName},</p>

<p>Hope your day is going well! ☀️ Time for your daily update — this only takes a few minutes.</p>

<p>Please reply to this email with:</p>

<p>
  1. 📋 <strong>What happened today?</strong><br>
  (deals, calls, demos, prospects — whatever moved the needle)
</p>

<p>2. 🏆 <strong>What went well?</strong></p>

<p>3. 🔧 <strong>If something didn't go as planned, what are you looking to do to improve?</strong></p>

<p>Thanks,<br>Sales Coach Agent 🚀</p>
`.trim();
    
  return {
    to: rep.email,
    subject: "Daily Update",
    body,
  };
}
