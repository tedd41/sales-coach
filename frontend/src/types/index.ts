export interface SalesRep {
  id: string;
  name: string;
  team: string;
  role: string;
  sentimentScore: number;
  riskLevel: "low" | "medium" | "high";
}

export interface RepDetails {
  id: string;
  name: string;
  role: string;
  team: string;
  sentimentTrend: number[];
  performanceSummary: {
    calls: number;
    demos: number;
  };
  riskLevel: string;
}

export interface Update {
  id: string;
  content: string;
  sentiment: number | null;
  tone: string | null;
  metrics: {
    calls: number;
    demos: number;
    emails: number;
    meetings: number;
  } | null;
  createdAt: string;
}

export interface Feedback {
  id: string;
  content: string;
  category: string | null;
  createdAt: string;
}

export interface Insights {
  challenges: string[];
  rootCauses: string[];
  opportunities: string[];
  riskLevel: "low" | "medium" | "high";
  summary: string;
}

export interface CoachingStrategy {
  strategy: string;
  weeklyPlan: string[];
  focusAreas: string[];
}

export interface DashboardData {
  teamSentimentTrend: number[];
  topPerformers: string[];
  atRiskReps: string[];
  aiSummary: string;
  alerts: Array<{
    repId: string;
    message: string;
    severity: "high" | "medium";
  }>;
}
