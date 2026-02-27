import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import type { SalesRep, DashboardData } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Users,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [repsData, dashboardData] = await Promise.all([
        api.getReps(),
        api.getDashboard(),
      ]);
      setReps(repsData);
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const sentimentData =
    dashboard?.teamSentimentTrend.map((value, index) => ({
      index: index + 1,
      sentiment: value,
    })) || [];

  const avgSentiment =
    (dashboard?.teamSentimentTrend.reduce((a, b) => a + b, 0) || 0) /
    (dashboard?.teamSentimentTrend.length || 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Sales Coach Intelligence
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                AI-powered sales team insights and coaching
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Health Score */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/20 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Team Health Index</span>
              <div className="flex items-center space-x-2">
                {avgSentiment >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Overall team engagement and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-primary dark:text-primary/90">
              {Math.round(avgSentiment)}{" "}
              <span className="text-3xl text-gray-400 dark:text-gray-500">
                / 100
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              {dashboard?.aiSummary}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sentiment Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Team Sentiment Trend</CardTitle>
              <CardDescription>Last 10 data points</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers & At Risk */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.topPerformers.length ? (
                  <ul className="space-y-2">
                    {dashboard.topPerformers.map((name) => (
                      <li
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="success">High</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No top performers this period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                  At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.atRiskReps.length ? (
                  <ul className="space-y-2">
                    {dashboard.atRiskReps.map((name) => (
                      <li
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="destructive">Risk</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No reps at risk
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Alerts */}
        {dashboard?.alerts && dashboard.alerts.length > 0 && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                AI Alerts
              </CardTitle>
              <CardDescription>
                Proactive insights requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dashboard.alerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <span
                      className={`h-2 w-2 mt-1.5 rounded-full ${alert.severity === "high" ? "bg-red-500" : "bg-orange-500"}`}
                    />
                    <span className="text-sm flex-1 dark:text-gray-300">
                      {alert.message}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              My Team
            </CardTitle>
            <CardDescription>
              Click on a rep to view detailed insights and coaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reps.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => navigate(`/rep/${rep.id}`)}
                  className="p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {rep.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {rep.role} • {rep.team}
                      </p>
                    </div>
                    <Badge
                      variant={
                        rep.riskLevel === "high"
                          ? "destructive"
                          : rep.riskLevel === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {rep.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Sentiment
                    </span>
                    <span className="font-semibold text-lg dark:text-gray-100">
                      {Math.round(rep.sentimentScore)}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        rep.sentimentScore >= 70
                          ? "bg-green-500"
                          : rep.sentimentScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${rep.sentimentScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
