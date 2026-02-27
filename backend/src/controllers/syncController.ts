import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { log } from "../services/logService";

const prisma = new PrismaClient();

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
export async function manualIngest(req: Request, res: Response) {
  try {
    const { repId, type, content, subject, category } = req.body;

    if (!repId || !content || !type) {
      return res
        .status(400)
        .json({
          error: "repId, type (update|feedback), and content are required",
        });
    }

    if (!["update", "feedback"].includes(type)) {
      return res
        .status(400)
        .json({ error: "type must be 'update' or 'feedback'" });
    }

    const rep = await prisma.salesRep.findUnique({ where: { id: repId } });
    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    const text = subject ? `[${subject}]\n\n${content}` : content;

    if (type === "update") {
      const update = await prisma.update.create({
        data: {
          repId,
          content: text,
          wordCount: content.trim().split(/\s+/).length,
        },
      });
      log.info("syncController.manualIngest", "Update saved", {
        repId,
        updateId: update.id,
      });
      return res.json({ data: update });
    }

    const feedback = await prisma.feedback.create({
      data: {
        repId,
        content: text,
        category: category ?? "email-sync",
      },
    });
    log.info("syncController.manualIngest", "Feedback saved", {
      repId,
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
 * POST /api/v1/sync/inbound
 * Mailgun inbound webhook - implement tomorrow per MAILGUN_TODO.md
 */
export async function mailgunInbound(req: Request, res: Response) {
  log.info(
    "syncController.mailgunInbound",
    "Webhook received (not yet implemented)",
  );
  res.status(200).json({ message: "received" });
}
