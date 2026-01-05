"use server";

import { generateComparisonInsights } from "@/lib/ai";
import { fetchReportNormalized, updateReportAnalysis } from "@/lib/reports";
import { revalidatePath } from "next/cache";
import { MetricChange, AiAnalysis } from "../generate/types";

export async function regenerateAnalysisAction(reportId: string) {
  try {
    const report = await fetchReportNormalized(reportId);
    const payload = report.normalized_metrics as
      | {
          metrics: MetricChange[];
          currentRange: { start: string; end: string };
          comparisonRange: { start: string; end: string };
        }
      | null;

    if (!payload) throw new Error("No normalized metrics stored for this report.");

    const analysis: AiAnalysis = await generateComparisonInsights({
      title: report.title,
      currentRange: payload.currentRange ?? {
        start: report.start_date,
        end: report.end_date,
      },
      comparisonRange: payload.comparisonRange ?? {
        start: report.comparison_start_date ?? report.start_date,
        end: report.comparison_end_date ?? report.end_date,
      },
      metrics: payload.metrics,
    });

    await updateReportAnalysis(reportId, analysis);
    revalidatePath("/reports");
    return { success: true, analysis };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to regenerate AI analysis.";
    return { success: false, error: message };
  }
}
