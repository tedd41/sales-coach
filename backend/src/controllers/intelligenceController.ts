import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as openaiService from "../services/openaiService";
import { log } from "../services/logService";

const prisma = new PrismaClient();

export async function generateInsights(req: Request, res: Response) {
  try {
    const { repId } = req.body;

    if (!repId) {
      return res.status(400).json({ error: "repId is required" });
    }

    const rep = await prisma.salesRep.findUnique({
      where: { id: repId },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        feedbacks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    const insights = await openaiService.generateInsights({
      updates: rep.updates.map((u) => ({
        content: u.content,
        sentiment: u.sentiment ?? 50,
        tone: u.tone ?? "neutral",
        createdAt: u.createdAt,
      })),
      feedback: rep.feedbacks.map((f) => ({
        content: f.content,
        category: f.category ?? "general",
      })),
      repName: rep.name,
    });

    res.json({ data: insights });
  } catch (error) {
    log.error(
      "intelligenceController.generateInsights",
      "Failed to generate insights",
      error,
      { repId: req.body.repId },
    );
    res
      .status(500)
      .json({ error: "Unable to generate insights. Please try again." });
  }
}

export async function generateStrategy(req: Request, res: Response) {
  try {
    const { repId } = req.body;

    if (!repId) {
      return res.status(400).json({ error: "repId is required" });
    }

    const rep = await prisma.salesRep.findUnique({
      where: { id: repId },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        feedbacks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    // Get insights first
    const insights = await openaiService.generateInsights({
      updates: rep.updates.map((u) => ({
        content: u.content,
        sentiment: u.sentiment ?? 50,
        tone: u.tone ?? "neutral",
        createdAt: u.createdAt,
      })),
      feedback: rep.feedbacks.map((f) => ({
        content: f.content,
        category: f.category ?? "general",
      })),
      repName: rep.name,
    });

    // Get top performer dynamically — rep with highest average sentiment
    const allReps = await prisma.salesRep.findMany({
      include: { updates: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    const topRep = allReps
      .map((r) => ({
        rep: r,
        avg:
          r.updates.length > 0
            ? r.updates.reduce((s, u) => s + (u.sentiment ?? 50), 0) /
              r.updates.length
            : 0,
      }))
      .sort((a, b) => b.avg - a.avg)[0]?.rep;

    const topPatterns = topRep
      ? topRep.updates
          .slice(0, 3)
          .map((u) => u.content)
          .join("\n")
      : "Focus on personalized outreach and quality over quantity.";

    const strategy = await openaiService.generateCoachingStrategy({
      summary: insights.summary,
      insights,
      topPerformerPatterns: topPatterns,
    });

    res.json({ data: strategy });
  } catch (error) {
    log.error(
      "intelligenceController.generateStrategy",
      "Failed to generate strategy",
      error,
      { repId: req.body.repId },
    );
    res
      .status(500)
      .json({ error: "Unable to generate strategy. Please try again." });
  }
}

export async function generateDraft(req: Request, res: Response) {
  try {
    const { repId, latestUpdate, length, tone, customInstructions, managerName } = req.body;

    if (!repId) {
      return res.status(400).json({ error: "repId is required" });
    }

    const rep = await prisma.salesRep.findUnique({
      where: { id: repId },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        feedbacks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    const updateContent =
      latestUpdate || rep.updates[0]?.content || "No recent update";

    // Get insights
    const insights = await openaiService.generateInsights({
      updates: rep.updates.map((u) => ({
        content: u.content,
        sentiment: u.sentiment ?? 50,
        tone: u.tone ?? "neutral",
        createdAt: u.createdAt,
      })),
      feedback: rep.feedbacks.map((f) => ({
        content: f.content,
        category: f.category ?? "general",
      })),
      repName: rep.name,
    });

    const draft = await openaiService.generateDraftResponse({
      update: updateContent,
      insights,
      repName: rep.name,
      length: length ?? "original",
      tone: tone ?? "original",
      customInstructions: customInstructions ?? "",
      managerName: managerName ?? "",
    });

    res.json({ data: { message: draft } });
  } catch (error) {
    log.error(
      "intelligenceController.generateDraft",
      "Failed to generate draft",
      error,
      { repId: req.body.repId },
    );
    res
      .status(500)
      .json({ error: "Unable to generate draft. Please try again." });
  }
}
