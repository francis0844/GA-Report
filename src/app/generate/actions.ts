"use server";

import { fetchAnalytics } from "@/lib/ga";
import { createReportRecord } from "@/lib/reports";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { MetricChange, GenerateActionResponse } from "./types";

type ActionResponse = GenerateActionResponse;

export async function generateAnalyticsAction(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const metricsText = String(formData.get("metrics") ?? "").trim();

  if (!startDate || !endDate) return { success: false, error: "Provide start and end dates." };

  try {
    const metrics = metricsText
      ? metricsText.split(",").map((m) => m.trim()).filter(Boolean)
      : undefined;

    const currentResult = await fetchAnalytics({
      startDate,
      endDate,
      metrics,
    });

    const comparisonRange = calculateComparisonRange(startDate, endDate);
    const comparisonResult = await fetchAnalytics({
      startDate: comparisonRange.start,
      endDate: comparisonRange.end,
      metrics,
    });

    const changes = computeChanges(currentResult.totals, comparisonResult.totals);

    const propertyId = process.env.GA4_PROPERTY_ID ?? "unknown";
    const report = await createReportRecord({
      title: `Report ${startDate} to ${endDate}`,
      propertyId,
      startDate,
      endDate,
      comparisonStart: comparisonRange.start,
      comparisonEnd: comparisonRange.end,
      rawGaData: { current: currentResult.raw, comparison: comparisonResult.raw },
      normalizedMetrics: {
        metrics: changes,
        currentRange: { start: startDate, end: endDate },
        comparisonRange,
      },
      type: "custom",
    });

    revalidatePath("/generate");
    return {
      success: true,
      data: {
        metrics: changes,
        currentRange: { start: startDate, end: endDate },
        comparisonRange,
        reportId: report.id,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch analytics.";
    return { success: false, error: message };
  }
}

function calculateComparisonRange(start: string, end: string) {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const duration = differenceInCalendarDays(endDate, startDate) + 1;
  const comparisonEnd = addDays(startDate, -1);
  const comparisonStart = addDays(comparisonEnd, -(duration - 1));
  return {
    start: comparisonStart.toISOString().slice(0, 10),
    end: comparisonEnd.toISOString().slice(0, 10),
  };
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
