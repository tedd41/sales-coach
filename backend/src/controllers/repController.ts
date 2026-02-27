import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { log } from "../services/logService";

const prisma = new PrismaClient();

export async function getAllReps(req: Request, res: Response) {
  try {
    const reps = await prisma.salesRep.findMany({
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const repsWithMetrics = reps.map((rep) => {
      const latestUpdate = rep.updates[0];
      const sentiment = latestUpdate?.sentiment || 50;

      let riskLevel: "low" | "medium" | "high" = "low";
      if (sentiment < 40) riskLevel = "high";
      else if (sentiment < 65) riskLevel = "medium";

      return {
        id: rep.id,
        name: rep.name,
        team: rep.team,
        role: rep.role,
        sentimentScore: sentiment,
        riskLevel,
      };
    });

    res.json({ data: repsWithMetrics });
  } catch (error) {
    log.error("repController.getAllReps", "Failed to fetch reps", error);
    res.status(500).json({ error: "Unable to load reps. Please try again." });
  }
}

export async function getRepById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const rep = await prisma.salesRep.findUnique({
      where: { id },
      include: {
        updates: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    // Calculate sentiment trend (oldest → newest so chart reads left-to-right)
    const sentimentTrend = rep.updates.map((u) => u.sentiment || 50);

    // Calculate performance summary from most recent update (last in asc array)
    const latestUpdate = rep.updates[rep.updates.length - 1];
    const latestMetrics = latestUpdate?.metrics
      ? JSON.parse(latestUpdate.metrics)
      : { calls: 0, demos: 0 };

    const avgSentiment =
      sentimentTrend.reduce((a, b) => a + b, 0) / sentimentTrend.length || 50;

    let riskLevel: "low" | "medium" | "high" = "low";
    if (avgSentiment < 40) riskLevel = "high";
    else if (avgSentiment < 65) riskLevel = "medium";

    res.json({
      data: {
        id: rep.id,
        name: rep.name,
        role: rep.role,
        team: rep.team,
        sentimentTrend,
        performanceSummary: latestMetrics,
        riskLevel,
      },
    });
  } catch (error) {
    log.error("repController.getRepById", "Failed to fetch rep", error, {
      repId: req.params.id,
    });
    res.status(500).json({ error: "Unable to load rep. Please try again." });
  }
}

export async function getRepUpdates(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const updates = await prisma.update.findMany({
      where: { repId: id },
      orderBy: { createdAt: "desc" },
    });

    const formattedUpdates = updates.map((u) => ({
      id: u.id,
      content: u.content,
      sentiment: u.sentiment,
      tone: u.tone,
      metrics: u.metrics ? JSON.parse(u.metrics) : null,
      createdAt: u.createdAt,
    }));

    res.json({ data: formattedUpdates });
  } catch (error) {
    log.error("repController.getRepUpdates", "Failed to fetch updates", error, {
      repId: req.params.id,
    });
    res
      .status(500)
      .json({ error: "Unable to load updates. Please try again." });
  }
}

export async function getRepFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const feedback = await prisma.feedback.findMany({
      where: { repId: id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: feedback });
  } catch (error) {
    log.error(
      "repController.getRepFeedback",
      "Failed to fetch feedback",
      error,
      { repId: req.params.id },
    );
    res
      .status(500)
      .json({ error: "Unable to load feedback. Please try again." });
  }
}

export async function createFeedback(req: Request, res: Response) {
  try {
    const { repId, content, category } = req.body;

    if (!repId || !content) {
      return res.status(400).json({ error: "repId and content are required" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        repId,
        content,
        category: category || "general",
      },
    });

    res.json({ data: feedback });
  } catch (error) {
    log.error(
      "repController.createFeedback",
      "Failed to create feedback",
      error,
      { repId: req.body.repId },
    );
    res
      .status(500)
      .json({ error: "Unable to save feedback. Please try again." });
  }
}

export async function getRepByEmail(req: Request, res: Response) {
  try {
    const { email } = req.params;

    const rep = await prisma.salesRep.findUnique({
      where: { email: decodeURIComponent(email) },
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 5 },
        feedbacks: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!rep) {
      return res.status(404).json({ error: "Rep not found" });
    }

    res.json({ data: rep });
  } catch (error) {
    log.error(
      "repController.getRepByEmail",
      "Failed to fetch rep by email",
      error,
      {
        email: req.params.email,
      },
    );
    res.status(500).json({ error: "Unable to load rep. Please try again." });
  }
}
