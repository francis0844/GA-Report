import OpenAI from "openai";
import { GaRow } from "./ga";
import { AiAnalysis, MetricChange } from "@/app/generate/types";

type InsightInput = {
  title: string;
  dateRange: { start: string; end: string };
  totals: { metric: string; value: number }[];
  timeseries: GaRow[];
};

export async function generateInsights({
  title,
  dateRange,
  totals,
  timeseries,
}: InsightInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary:
        "AI insights unavailable: please set OPENAI_API_KEY to enable generated narratives.",
      model: "not-configured",
    };
  }

  const client = new OpenAI({ apiKey });
  const totalSummary = totals
    .map((t) => `${t.metric}: ${t.value.toFixed(2)}`)
    .join(", ");
  const timeline = timeseries
    .map(
      (row) =>
        `${row.date} (${Object.entries(row.metrics)
          .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
          .join(", ")})`
    )
    .join("; ");

  const prompt = `
You are an analytics strategist. Summarize the following GA4 performance data in clear, actionable bullets.

Report: ${title}
Date range: ${dateRange.start} to ${dateRange.end}
Totals: ${totalSummary}
Timeline: ${timeline}

Return 3-5 concise bullets that call out trends, anomalies, and recommended next actions. Keep each bullet under 20 words.`;

  const completion = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    input: prompt,
  });

  const summary =
    completion.output_text ??
    "AI insights unavailable: the model did not return text. Please try again.";

  return {
    summary,
    model: completion.model ?? "gpt-4o-mini",
  };
}

type ComparisonInsightsInput = {
  title: string;
  currentRange: { start: string; end: string };
  comparisonRange: { start: string; end: string };
  metrics: MetricChange[];
};

export async function generateComparisonInsights(
  payload: ComparisonInsightsInput
): Promise<AiAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      perMetric: [],
      anomalies: ["AI unavailable: set OPENAI_API_KEY to enable insights."],
      seoRecommendations: [],
      technicalRecommendations: [],
      summary: "AI unavailable: OPENAI_API_KEY missing.",
    };
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildComparisonPrompt(payload);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      perMetric: parsed.perMetric ?? [],
      anomalies: parsed.anomalies ?? [],
      seoRecommendations: parsed.seoRecommendations ?? [],
      technicalRecommendations: parsed.technicalRecommendations ?? [],
      summary: parsed.summary ?? "",
    };
  } catch {
    return {
      perMetric: [],
      anomalies: ["AI response could not be parsed."],
      seoRecommendations: [],
      technicalRecommendations: [],
      summary: text,
    };
  }
}

function buildComparisonPrompt(input: ComparisonInsightsInput) {
  const metricLines = input.metrics
    .map(
      (m) =>
        `${m.metric}: current=${m.current}, comparison=${m.comparison}, absChange=${m.absChange}, pctChange=${m.pctChange}`
    )
    .join("\n");

  return `
You are a web analytics strategist. Analyze GA4 metrics for ${input.title}.
Current range: ${input.currentRange.start} to ${input.currentRange.end}
Comparison range: ${input.comparisonRange.start} to ${input.comparisonRange.end}

Metrics (one per line):
${metricLines}

Return strict JSON with keys:
{
  "perMetric": [{"metric": "...", "insight": "...", "impact": "..."}],
  "anomalies": ["..."],
  "seoRecommendations": ["..."],
  "technicalRecommendations": ["..."],
  "summary": "overall takeaway"
}`;
}
