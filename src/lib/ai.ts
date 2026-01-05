import OpenAI from "openai";
import { GaRow } from "./ga";

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
