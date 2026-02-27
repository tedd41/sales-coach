import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import type {
  RepDetails as RepDetailsType,
  Update,
  Feedback,
  Insights,
  CoachingStrategy,
} from "@/types";
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
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Target,
  Calendar,
  Phone,
  Video,
  Mail,
  Users as UsersIcon,
  Pencil,
  X,
} from "lucide-react";

export default function RepDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rep, setRep] = useState<RepDetailsType | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [strategy, setStrategy] = useState<CoachingStrategy | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [rawFeedback, setRawFeedback] = useState("");
  const [showRawFeedback, setShowRawFeedback] = useState(false);
  const [savingRaw, setSavingRaw] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [repData, updatesData, feedbackData] = await Promise.all([
        api.getRepById(id),
        api.getRepUpdates(id),
        api.getRepFeedback(id),
      ]);
      setRep(repData);
      setUpdates(updatesData);
      setFeedback(feedbackData);
    } catch (error) {
      console.error("Failed to load rep data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!id) return;
    setLoadingInsights(true);
    try {
      const insightsData = await api.generateInsights(id);
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!id) return;
    setLoadingStrategy(true);
    try {
      const strategyData = await api.generateStrategy(id);
      setStrategy(strategyData);
    } catch (error) {
      console.error("Failed to generate strategy:", error);
    } finally {
      setLoadingStrategy(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!id) return;
    setLoadingDraft(true);
    try {
      const draftData = await api.generateDraft(id);
      setDraft(draftData.message);
    } catch (error) {
      console.error("Failed to generate draft:", error);
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!id || !draft) return;
    try {
      await api.saveFeedback(id, draft, "coaching");
      const updatedFeedback = await api.getRepFeedback(id);
      setFeedback(updatedFeedback);
      setDraft("");
      alert("Feedback saved! This will be used to train the AI.");
    } catch (error) {
      console.error("Failed to save feedback:", error);
      alert("Failed to save feedback. Please try again.");
    }
  };

  const handleSaveRawFeedback = async () => {
    if (!id || !rawFeedback.trim()) return;
    setSavingRaw(true);
    try {
      await api.saveFeedback(id, rawFeedback.trim(), "manual");
      const updatedFeedback = await api.getRepFeedback(id);
      setFeedback(updatedFeedback);
      setRawFeedback("");
      setShowRawFeedback(false);
    } catch (error) {
      console.error("Failed to save raw feedback:", error);
      alert("Failed to save feedback. Please try again.");
    } finally {
      setSavingRaw(false);
    }
  };

  if (loading || !rep) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // updates arrive newest-first; reverse so chart reads oldest → newest (left → right)
  const sentimentData = [...updates].reverse().map((u) => ({
    date: new Date(u.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    sentiment: u.sentiment ?? 50,
    tone: u.tone,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {rep.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              className="text-base px-4 py-2"
            >
              {rep.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Activity & Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Phone className="h-5 w-5 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {rep.performanceSummary.calls}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Calls
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Video className="h-5 w-5 mx-auto mb-2 text-green-600 dark:text-green-400" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {rep.performanceSummary.demos}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Demos
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Mail className="h-5 w-5 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      N/A
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Emails
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <UsersIcon className="h-5 w-5 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      N/A
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Meetings
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {rep.sentimentTrend[rep.sentimentTrend.length - 1] >= 70 ? (
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Sentiment Trend
                </CardTitle>
                <CardDescription>
                  Emotional engagement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={sentimentData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}`, "Sentiment"]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sentiment"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                      AI Insights
                    </CardTitle>
                    <CardDescription>Deep performance analysis</CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={loadingInsights}
                  >
                    {loadingInsights ? "Analyzing..." : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {insights ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 dark:text-gray-200">
                        Summary
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {insights.summary}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 dark:text-gray-200">
                        Challenges
                      </h4>
                      <ul className="space-y-1">
                        {insights.challenges.map((challenge, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                          >
                            <span className="text-red-500 mr-2">•</span>
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 dark:text-gray-200">
                        Opportunities
                      </h4>
                      <ul className="space-y-1">
                        {insights.opportunities.map((opp, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                          >
                            <span className="text-green-500 mr-2">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click Generate to analyze performance patterns
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Recent daily updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div
                      key={update.id}
                      className="border-l-4 border-primary pl-4 py-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          {update.sentiment && (
                            <Badge
                              variant={
                                update.sentiment >= 70
                                  ? "success"
                                  : update.sentiment >= 50
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              {Math.round(update.sentiment)}
                            </Badge>
                          )}
                          {update.tone && (
                            <Badge variant="outline">{update.tone}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {update.content}
                      </p>
                      {update.metrics && (
                        <div className="mt-2 flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>📞 {update.metrics.calls} calls</span>
                          <span>🎥 {update.metrics.demos} demos</span>
                          <span>✉️ {update.metrics.emails} emails</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Coaching */}
          <div className="space-y-6">
            {/* Coaching Strategy */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-4 w-4 mr-2" />
                      Coaching Strategy
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGenerateStrategy}
                    disabled={loadingStrategy}
                  >
                    {loadingStrategy ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {strategy ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 dark:text-gray-200">
                        Strategy
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {strategy.strategy}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Weekly Plan
                      </h4>
                      <ul className="space-y-2">
                        {strategy.weeklyPlan.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                          >
                            <span className="font-semibold mr-2 dark:text-gray-100">
                              {idx + 1}.
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Focus Areas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.focusAreas.map((area, idx) => (
                          <Badge key={idx} variant="secondary">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate a personalized coaching strategy
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Draft Response */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Draft Feedback
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Write raw feedback"
                      onClick={() => {
                        setShowRawFeedback((v) => !v);
                        setRawFeedback("");
                      }}
                    >
                      {showRawFeedback ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleGenerateDraft}
                      disabled={loadingDraft}
                    >
                      {loadingDraft ? "Writing..." : "Generate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showRawFeedback ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Write feedback directly — saved straight to coaching
                      memory.
                    </p>
                    <textarea
                      className="w-full p-3 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      rows={8}
                      placeholder={`Write your feedback for ${rep.name}...`}
                      value={rawFeedback}
                      onChange={(e) => setRawFeedback(e.target.value)}
                      autoFocus
                    />
                    <Button
                      className="mt-3 w-full"
                      variant="default"
                      onClick={handleSaveRawFeedback}
                      disabled={savingRaw || !rawFeedback.trim()}
                    >
                      {savingRaw ? "Saving..." : "Save Feedback"}
                    </Button>
                  </div>
                ) : draft ? (
                  <div>
                    <textarea
                      className="w-full p-3 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      rows={10}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <Button
                      className="mt-3 w-full"
                      variant="default"
                      onClick={handleSendFeedback}
                    >
                      Send Feedback
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate a personalized message for {rep.name}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Coaching History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coaching History</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.length > 0 ? (
                  <div className="space-y-3">
                    {feedback.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        {item.category && (
                          <Badge variant="outline" className="mb-2">
                            {item.category}
                          </Badge>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {item.content}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No coaching history yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
