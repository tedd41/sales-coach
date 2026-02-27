import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { log } from "../services/logService";

const prisma = new PrismaClient();

export async function getDashboard(req: Request, res: Response) {
  try {
    const reps = await prisma.salesRep.findMany({
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // Calculate team sentiment trend (last 5 data points)
    const allUpdates = await prisma.update.findMany({
      orderBy: { createdAt: "asc" },
      select: { sentiment: true, createdAt: true },
    });

    const teamSentimentTrend = allUpdates
      .filter((u) => u.sentiment !== null)
      .slice(-10)
      .map((u) => u.sentiment || 50);

    // Identify top performers and at-risk reps
    const repsWithAvgSentiment = reps.map((rep) => {
      const avgSentiment =
        rep.updates.reduce((sum, u) => sum + (u.sentiment || 50), 0) /
          rep.updates.length || 50;
      return { ...rep, avgSentiment };
    });

    const topPerformers = repsWithAvgSentiment
      .filter((r) => r.avgSentiment >= 80)
      .map((r) => r.name);

    const atRiskReps = repsWithAvgSentiment
      .filter((r) => r.avgSentiment < 50)
      .map((r) => r.name);

    // Generate alerts
    const alerts = repsWithAvgSentiment
      .filter((r) => r.avgSentiment < 50)
      .map((r) => ({
        repId: r.id,
        message: `${r.name} showing declining engagement (sentiment: ${Math.round(r.avgSentiment)})`,
        severity: (r.avgSentiment < 35 ? "high" : "medium") as
          | "high"
          | "medium",
      }));

    // AI summary
    const aiSummary =
      atRiskReps.length > 0
        ? `${atRiskReps.length} rep${atRiskReps.length > 1 ? "s" : ""} showing declining engagement this week. ${topPerformers.length} top performer${topPerformers.length > 1 ? "s" : ""} maintaining strong results.`
        : `Team performing well. ${topPerformers.length} top performer${topPerformers.length > 1 ? "s" : ""} leading the way.`;

    res.json({
      data: {
        teamSentimentTrend,
        topPerformers,
        atRiskReps,
        aiSummary,
        alerts,
      },
    });
  } catch (error) {
    log.error(
      "dashboardController.getDashboard",
      "Failed to fetch dashboard data",
      error,
    );
    res
      .status(500)
      .json({ error: "Unable to load dashboard. Please try again." });
  }
}
