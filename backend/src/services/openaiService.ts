import OpenAI from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!endpoint || !apiKey) {
      throw new Error(
        "Azure OpenAI credentials not configured. Check .env file.",
      );
    }

    // Remove trailing slash from endpoint if present
    const baseURL = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

    client = new OpenAI({
      apiKey,
      baseURL: `${baseURL}/openai/deployments/${deploymentName}`,
      defaultQuery: { "api-version": apiVersion },
      defaultHeaders: { "api-key": apiKey },
    });
  }
  return client;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  temperature: number = 0.7,
): Promise<string> {
  try {
    const openaiClient = getClient();

    const result = await openaiClient.chat.completions.create({
      model: deploymentName, // This is ignored by Azure but required by SDK
      messages,
      temperature,
      max_tokens: 1000,
    });

    return result.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Azure OpenAI Error:", error);
    throw new Error("Failed to get completion from Azure OpenAI");
  }
}

export async function analyzeSentiment(content: string): Promise<{
  sentiment: number;
  tone: string;
  explanation: string;
}> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an expert sales performance analyst.

Your task is to analyze daily sales updates and detect:
1. Emotional sentiment (0-100 scale)
2. Tone (proactive, stressed, defensive, disengaged, confident, neutral, burnout)
3. Risk signals

Return ONLY valid JSON with no markdown formatting.`,
    },
    {
      role: "user",
      content: `Analyze the following update:

${content}

Return JSON:
{
  "sentiment": <number 0-100>,
  "tone": "<string>",
  "explanation": "<brief explanation>"
}`,
    },
  ];

  const response = await getChatCompletion(messages, 0.3);

  try {
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse sentiment response:", response);
    return {
      sentiment: 50,
      tone: "neutral",
      explanation: "Unable to analyze",
    };
  }
}

export async function generateInsights(data: {
  updates: Array<{
    content: string;
    sentiment: number;
    tone: string;
    createdAt: Date;
  }>;
  feedback: Array<{ content: string; category: string }>;
  repName: string;
}): Promise<{
  challenges: string[];
  rootCauses: string[];
  opportunities: string[];
  riskLevel: "low" | "medium" | "high";
  summary: string;
}> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a senior sales coach with experience scaling teams.

You analyze performance trends, behavioral patterns and coaching opportunities.
You focus on actionable insights.

Return ONLY valid JSON with no markdown formatting.`,
    },
    {
      role: "user",
      content: `Analyze ${data.repName}'s performance:

Recent updates:
${data.updates.map((u, i) => `${i + 1}. [${u.createdAt.toLocaleDateString()}] Sentiment: ${u.sentiment}, Tone: ${u.tone}\n   "${u.content}"`).join("\n\n")}

Sentiment trend: ${data.updates.map((u) => u.sentiment).join(" → ")}

Past feedback given:
${data.feedback.map((f) => `- [${f.category}] ${f.content}`).join("\n")}

Identify:
1. Key challenges (2-3 items)
2. Root causes (2-3 items)
3. Opportunities (2-3 items)
4. Risk level (low, medium, or high)
5. Summary (2-3 sentences)

Return JSON:
{
  "challenges": ["...", "..."],
  "rootCauses": ["...", "..."],
  "opportunities": ["...", "..."],
  "riskLevel": "low|medium|high",
  "summary": "..."
}`,
    },
  ];

  const response = await getChatCompletion(messages, 0.4);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse insights response:", response);
    return {
      challenges: ["Unable to analyze"],
      rootCauses: ["Data unavailable"],
      opportunities: [],
      riskLevel: "medium",
      summary: "Analysis pending",
    };
  }
}

export async function generateCoachingStrategy(data: {
  summary: string;
  insights: any;
  topPerformerPatterns: string;
}): Promise<{
  strategy: string;
  weeklyPlan: string[];
  focusAreas: string[];
}> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an elite sales leader known for improving underperforming teams.

You coach with clarity, empathy and practical strategies.
You personalize guidance and avoid generic advice.

Return ONLY valid JSON with no markdown formatting.`,
    },
    {
      role: "user",
      content: `A sales representative is struggling.

Current situation:
${data.summary}

Insights:
${JSON.stringify(data.insights, null, 2)}

Top performers in the team:
${data.topPerformerPatterns}

Suggest:
1. Coaching strategy (2-3 paragraphs)
2. Weekly action plan (3-5 specific actions)
3. Focus areas (3-4 items)

Return JSON:
{
  "strategy": "...",
  "weeklyPlan": ["...", "..."],
  "focusAreas": ["...", "..."]
}`,
    },
  ];

  const response = await getChatCompletion(messages, 0.6);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse strategy response:", response);
    return {
      strategy: "Focus on personalized outreach and quality over quantity.",
      weeklyPlan: [
        "Research prospects before outreach",
        "Reduce volume, increase personalization",
      ],
      focusAreas: ["Prospecting", "Personalization"],
    };
  }
}

export async function generateDraftResponse(data: {
  update: string;
  insights: any;
  repName: string;
}): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a sales manager writing personalized feedback.

You are supportive, direct and motivating.
You avoid generic or robotic language.
You use specific observations.`,
    },
    {
      role: "user",
      content: `Write a personalized message for ${data.repName}.

Their recent update:
"${data.update}"

AI Insights:
${JSON.stringify(data.insights, null, 2)}

Write a concise, practical and motivating message (3-4 paragraphs). Be specific and actionable.`,
    },
  ];

  return await getChatCompletion(messages, 0.7);
}
