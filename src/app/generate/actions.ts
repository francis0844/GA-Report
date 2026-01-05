"use server";

import { fetchAnalytics } from "@/lib/ga";
import { createReportRecord, updateReportAnalysis } from "@/lib/reports";
import { revalidatePath } from "next/cache";
import { MetricChange, GenerateActionResponse } from "./types";
import { generateComparisonInsights } from "@/lib/ai";

type ActionResponse = GenerateActionResponse;

export async function generateAnalyticsAction(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const currentStartDate = String(formData.get("currentStartDate") ?? "");
  const currentEndDate = String(formData.get("currentEndDate") ?? "");
  const comparisonStartDate = String(formData.get("comparisonStartDate") ?? "");
  const comparisonEndDate = String(formData.get("comparisonEndDate") ?? "");
  const comparisonType = String(formData.get("comparisonType") ?? "custom");
  const metricsText = String(formData.get("metrics") ?? "").trim();

  if (!currentStartDate || !currentEndDate || !comparisonStartDate || !comparisonEndDate) {
    return { success: false, error: "Provide current and comparison date ranges." };
  }

  try {
    const metrics = metricsText
      ? metricsText.split(",").map((m) => m.trim()).filter(Boolean)
      : undefined;

    const currentResult = await fetchAnalytics({
      startDate: currentStartDate,
      endDate: currentEndDate,
      metrics,
    });

    const comparisonResult = await fetchAnalytics({
      startDate: comparisonStartDate,
      endDate: comparisonEndDate,
      metrics,
    });

    const changes = computeChanges(currentResult.totals, comparisonResult.totals);

    const propertyId = process.env.GA4_PROPERTY_ID ?? "unknown";
    const report = await createReportRecord({
      title: `Report ${currentStartDate} to ${currentEndDate}`,
      propertyId,
      startDate: currentStartDate,
      endDate: currentEndDate,
      comparisonStart: comparisonStartDate,
      comparisonEnd: comparisonEndDate,
      rawGaData: { current: currentResult.raw, comparison: comparisonResult.raw },
      normalizedMetrics: {
        metrics: changes,
        currentRange: { start: currentStartDate, end: currentEndDate },
        comparisonRange: { start: comparisonStartDate, end: comparisonEndDate },
      },
      type: comparisonType || "custom",
    });

    let analysis = null;
    try {
      analysis = await generateComparisonInsights({
        title: report.title,
        currentRange: { start: currentStartDate, end: currentEndDate },
        comparisonRange: { start: comparisonStartDate, end: comparisonEndDate },
        metrics: changes,
      });
      await updateReportAnalysis(report.id, analysis);
    } catch {
      // AI optional; ignore failures but return message in summary.
      analysis = {
        summary: "AI analysis unavailable. Check OPENAI_API_KEY.",
        perMetric: [],
        anomalies: [],
        seoRecommendations: [],
        technicalRecommendations: [],
      };
    }

    revalidatePath("/generate");
    return {
      success: true,
      data: {
        metrics: changes,
        currentRange: { start: currentStartDate, end: currentEndDate },
        comparisonRange: { start: comparisonStartDate, end: comparisonEndDate },
        reportId: report.id,
        analysis: analysis ?? undefined,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch analytics.";
    return { success: false, error: message };
  }
}

export async function generateMockReportAction(
  currentStartDate: string,
  currentEndDate: string,
  comparisonStartDate: string,
  comparisonEndDate: string,
  comparisonType: string
): Promise<ActionResponse> {
  try {
    if (!currentStartDate || !currentEndDate || !comparisonStartDate || !comparisonEndDate) {
      return { success: false, error: "Provide current and comparison date ranges for mock data." };
    }

    const mockMetrics = buildMockMetrics();
    const propertyId = process.env.GA4_PROPERTY_ID ?? "mock-property";

    const report = await createReportRecord({
      title: `Mock Report ${currentStartDate} to ${currentEndDate}`,
      propertyId,
      startDate: currentStartDate,
      endDate: currentEndDate,
      comparisonStart: comparisonStartDate,
      comparisonEnd: comparisonEndDate,
      rawGaData: { mock: true },
      normalizedMetrics: {
        metrics: mockMetrics,
        currentRange: { start: currentStartDate, end: currentEndDate },
        comparisonRange: { start: comparisonStartDate, end: comparisonEndDate },
      },
      type: comparisonType || "custom",
    });

    await updateReportAnalysis(report.id, {
      summary: "Mock AI analysis for demo purposes.",
      perMetric: mockMetrics.map((m) => ({
        metric: m.metric,
        insight: m.absChange >= 0 ? "Positive trend noted." : "Decline observed.",
        impact: "Mock impact",
      })),
      anomalies: ["Mock anomalies not evaluated."],
      seoRecommendations: ["Mock SEO rec."],
      technicalRecommendations: ["Mock technical rec."],
    });

    revalidatePath("/generate");
    return {
      success: true,
      data: {
        metrics: mockMetrics,
        currentRange: { start: currentStartDate, end: currentEndDate },
        comparisonRange: { start: comparisonStartDate, end: comparisonEndDate },
        reportId: report.id,
        analysis: {
          summary: "Mock AI analysis for demo purposes.",
          perMetric: [],
          anomalies: [],
          seoRecommendations: [],
          technicalRecommendations: [],
        },
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate mock report.";
    return { success: false, error: message };
  }
}

function computeChanges(
  currentTotals: { metric: string; value: number }[],
  comparisonTotals: { metric: string; value: number }[]
): MetricChange[] {
  const map = new Map<string, { current: number; comparison: number }>();

  currentTotals.forEach((item) => {
    map.set(item.metric, { current: item.value, comparison: 0 });
  });

  comparisonTotals.forEach((item) => {
    const existing = map.get(item.metric);
    if (existing) {
      existing.comparison = item.value;
      map.set(item.metric, existing);
    } else {
      map.set(item.metric, { current: 0, comparison: item.value });
    }
  });

  const changes: MetricChange[] = [];
  map.forEach((vals, metric) => {
    const absChange = vals.current - vals.comparison;
    const pctChange =
      vals.comparison === 0 ? (vals.current === 0 ? 0 : 100) : (absChange / vals.comparison) * 100;
    changes.push({
      metric,
      current: vals.current,
      comparison: vals.comparison,
      absChange,
      pctChange,
    });
  });

  return changes;
}

function buildMockMetrics(): MetricChange[] {
  // Generate realistic-ish web metrics with random variation.
  const ranges = [
    { metric: "sessions", min: 800, max: 6000 },
    { metric: "totalUsers", min: 600, max: 5000 },
    { metric: "eventCount", min: 2000, max: 14000 },
    { metric: "conversions", min: 40, max: 300 },
    { metric: "purchaseRevenue", min: 2000, max: 12000 },
  ];

  return ranges.map((r) => {
    const comparison = randomInRange(r.min, r.max);
    const trendMultiplier = randomInRange(0.8, 1.3); // up to -20% decline or +30% lift
    const current = Math.max(0, comparison * trendMultiplier);
    const absChange = current - comparison;
    const pctChange =
      comparison === 0 ? (current === 0 ? 0 : 100) : (absChange / comparison) * 100;
    return {
      metric: r.metric,
      current: Number(current.toFixed(2)),
      comparison: Number(comparison.toFixed(2)),
      absChange: Number(absChange.toFixed(2)),
      pctChange: Number(pctChange.toFixed(2)),
    };
  });
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}
