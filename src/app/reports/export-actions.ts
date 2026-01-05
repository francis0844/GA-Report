"use server";

import { getSupabaseClient } from "@/lib/supabase";
import { MetricChange, AiAnalysis } from "@/app/generate/types";

export type PdfReportPayload = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  comparison_start_date: string | null;
  comparison_end_date: string | null;
  metrics: MetricChange[];
  currentRange: { start: string; end: string };
  comparisonRange: { start: string; end: string };
  analysis?: AiAnalysis | null;
};

export async function loadReportsForPdf(ids: string[]) {
  if (!ids?.length) return { error: "Select at least one report." };
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id,title,start_date,end_date,comparison_start_date,comparison_end_date,normalized_metrics,ai_analysis")
    .in("id", ids);

  if (error || !data) {
    return { error: error?.message ?? "Unable to load reports for export." };
  }

  const payloads: PdfReportPayload[] = data
    .map((row) => {
      const norm = (row.normalized_metrics as {
        metrics?: MetricChange[];
        currentRange?: { start: string; end: string };
        comparisonRange?: { start: string; end: string };
      }) ?? {};
      const metrics: MetricChange[] = norm.metrics ?? [];
      const currentRange = norm.currentRange ?? { start: row.start_date, end: row.end_date };
      const comparisonRange = norm.comparisonRange ?? {
        start: row.comparison_start_date ?? row.start_date,
        end: row.comparison_end_date ?? row.end_date,
      };
      return {
        id: row.id,
        title: row.title,
        start_date: row.start_date,
        end_date: row.end_date,
        comparison_start_date: row.comparison_start_date,
        comparison_end_date: row.comparison_end_date,
        metrics,
        currentRange,
        comparisonRange,
        analysis: (row.ai_analysis as AiAnalysis | null) ?? null,
      };
    })
    .filter((p) => p.metrics.length);

  if (!payloads.length) {
    return { error: "No stored metrics found for selected reports." };
  }

  return { success: true, reports: payloads };
}
