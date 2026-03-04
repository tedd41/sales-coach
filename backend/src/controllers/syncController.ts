import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { log } from "../services/logService";
import { emailParser } from "../services/emailParsingService";
import { sendDailyUpdateEmails } from "../services/cronService";
import { analyzeSentiment } from "../services/openaiService";

const prisma = new PrismaClient();

/** Fire-and-forget: enrich an Update row with sentiment + tone after save. */
function enrichUpdateAsync(updateId: string, content: string): void {
  analyzeSentiment(content)
    .then((result) =>
      prisma.update.update({
        where: { id: updateId },
        data: { sentiment: result.sentiment, tone: result.tone },
      }),
    )
    .then(() =>
      log.info("syncController.enrichUpdate", "Sentiment enriched", { updateId }),
    )
    .catch((err) =>
      log.warn("syncController.enrichUpdate", "Sentiment enrichment failed", {
        updateId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
}

/**
 * POST /api/v1/sync/manual
 * Ingest email content from a chain into the DB.
 *
 * Rep message (activity/pipeline update):
 *   { repId, type: "update", content, subject? }
 *
 * Manager coaching reply:
 *   { repId, type: "feedback", content, subject?, category? }
 */
/**
 * POST /api/v1/sync/test-daily-update  (dev only)
 * Manually fires the daily update job so you can verify PA + DEV_EMAIL routing
 * without waiting for the cron schedule.
 */
export async function triggerDailyUpdate(req: Request, res: Response) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  log.info("syncController.triggerDailyUpdate", "Manual daily update trigger fired");

  try {
    await sendDailyUpdateEmails();
    return res.json({ message: "Daily update job completed — check DEV_EMAIL" });
  } catch (error) {
    log.error("syncController.triggerDailyUpdate", "Job failed", error);
    return res.status(500).json({ error: "Job failed — check server logs" });
  }
}

export async function manualIngest(req: Request, res: Response) {
  try {
    const { repId, repEmail, type, content, subject, category } = req.body;

    if (!content || !type) {
      return res.status(400).json({
        error: "type (update|feedback) and content are required",
      });
    }

    if (!repId && !repEmail) {
      return res.status(400).json({
        error: "Provide either repId or repEmail",
      });
    }

    if (!["update", "feedback"].includes(type)) {
      return res
        .status(400)
        .json({ error: "type must be 'update' or 'feedback'" });
    }

    const rep = repId
      ? await prisma.salesRep.findUnique({ where: { id: repId } })
      : await prisma.salesRep.findFirst({
          where: { email: { equals: (repEmail as string).toLowerCase() } },
        });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    const text = subject ? `[${subject}]\n\n${content}` : content;

    if (type === "update") {
      const update = await prisma.update.create({
        data: {
          repId: rep.id,
          content: text,
          wordCount: content.trim().split(/\s+/).length,
        },
      });
      log.info("syncController.manualIngest", "Update saved", {
        repId: rep.id,
        updateId: update.id,
      });
      // Enrich with sentiment/tone in the background — don't block the response
      enrichUpdateAsync(update.id, content);
      return res.json({ data: update });
    }

    const feedback = await prisma.feedback.create({
      data: {
        repId: rep.id,
        content: text,
        category: category ?? "email-sync",
      },
    });
    log.info("syncController.manualIngest", "Feedback saved", {
      repId: rep.id,
      feedbackId: feedback.id,
    });
    return res.json({ data: feedback });
  } catch (error) {
    log.error("syncController.manualIngest", "Failed to save", error, {
      repId: req.body.repId,
    });
    res.status(500).json({ error: "Failed to save" });
  }
}

/**
 * POST /api/v1/sync/webhook
 * Power Automate inbound webhook.
 *
 * PA sends query params: From, To, Subject
 * PA sends the raw Outlook HTML body as text/plain in req.body
 *
 * Routing logic:
 *   - From is a SalesRep  → save as Update
 *   - From is a Manager   → split To addresses, save a Feedback per matching SalesRep
 *   - From unknown        → log warning & return 200 (never crash the webhook)
 */
export async function powerAutomateWebhook(req: Request, res: Response) {
  try {
    const from = ((req.query.From as string) || "").toLowerCase().trim();
    const toRaw = (req.query.To as string) || "";
    const subject = (req.query.Subject as string) || "";
    const rawBody = typeof req.body === "string" ? req.body : "";

    log.info("syncController.powerAutomateWebhook", "Webhook received", {
      from,
      to: toRaw,
      subject,
    });

    if (!from) {
      log.warn(
        "syncController.powerAutomateWebhook",
        "Missing From query param — ignoring",
      );
      return res.status(200).json({ message: "received" });
    }

    // Parse email body via GPT — verbatim, HTML stripped, latest message only
    const { text: cleanText } = await emailParser.parse(rawBody);

    // -----------------------------------------------------------------------
    // Identify sender role
    // -----------------------------------------------------------------------
    // Note: emails are already lowercased before comparison
    const [rep, manager] = await Promise.all([
      prisma.salesRep.findFirst({
        where: { email: { equals: from, mode: "insensitive" } },
      }),
      prisma.manager.findFirst({
        where: { email: { equals: from, mode: "insensitive" } },
      }),
    ]);

    // -----------------------------------------------------------------------
    // From = SalesRep → Update
    // -----------------------------------------------------------------------
    if (rep) {
      const content = subject ? `[${subject}]\n\n${cleanText}` : cleanText;
      const update = await prisma.update.create({
        data: {
          repId: rep.id,
          content,
          wordCount: cleanText.trim().split(/\s+/).filter(Boolean).length,
        },
      });
      log.info(
        "syncController.powerAutomateWebhook",
        "Update saved from rep email",
        { repId: rep.id, updateId: update.id },
      );
      // Enrich with sentiment/tone in the background — don't block the webhook response
      enrichUpdateAsync(update.id, cleanText);
      return res.status(200).json({ message: "received", type: "update" });
    }

    // -----------------------------------------------------------------------
    // From = Manager → Feedback for each matched rep in To
    // -----------------------------------------------------------------------
    if (manager) {
      const toEmails = toRaw
        .split(/[,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (toEmails.length === 0) {
        log.warn(
          "syncController.powerAutomateWebhook",
          "Manager email but no To addresses — ignoring",
          { from },
        );
        return res.status(200).json({ message: "received" });
      }

      // Find which To addresses belong to SalesReps
      const matchedReps = await prisma.salesRep.findMany({
        where: {
          email: { in: toEmails, mode: "insensitive" },
        },
      });

      if (matchedReps.length === 0) {
        log.warn(
          "syncController.powerAutomateWebhook",
          "Manager email but no matching reps found in To — ignoring",
          { from, toEmails },
        );
        return res.status(200).json({ message: "received" });
      }

      const content = subject ? `[${subject}]\n\n${cleanText}` : cleanText;

      const results = await Promise.all(
        matchedReps.map((r) =>
          prisma.feedback.create({
            data: {
              repId: r.id,
              content,
              category: "email-sync",
            },
          }),
        ),
      );

      log.info(
        "syncController.powerAutomateWebhook",
        `Feedback saved for ${results.length} rep(s) from manager email`,
        { managerId: manager.id, repIds: matchedReps.map((r) => r.id) },
      );
      return res
        .status(200)
        .json({ message: "received", type: "feedback", count: results.length });
    }

    // -----------------------------------------------------------------------
    // Unknown sender — log and move on
    // -----------------------------------------------------------------------
    log.warn(
      "syncController.powerAutomateWebhook",
      "Email from unknown sender — not a rep or manager in DB",
      { from },
    );
    return res.status(200).json({ message: "received" });
  } catch (error) {
    log.error(
      "syncController.powerAutomateWebhook",
      "Unhandled error processing webhook",
      error,
    );
    // Always return 200 to Power Automate so it doesn't retry indefinitely
    return res.status(200).json({ message: "received" });
  }
}
