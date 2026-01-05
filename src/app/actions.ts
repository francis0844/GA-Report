"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInsights } from "@/lib/ai";
import { fetchAnalytics } from "@/lib/ga";
import {
  cleanupOldReports,
  createReportRecord,
  fetchReportBundle,
  storeAiInsight,
  storeNormalizedData,
  storeRawResponse,
} from "@/lib/reports";

const createReportSchema = z.object({
  title: z.string().min(3),
  propertyId: z.string().min(4),
  startDate: z.string(),
  endDate: z.string(),
});

export async function createReportAction(
  _prevState: { error?: string; success?: boolean; reportId?: string },
  formData: FormData
): Promise<{ error?: string; success?: boolean; reportId?: string }> {
  try {
    const parsed = createReportSchema.parse({
      title: formData.get("title"),
      propertyId: formData.get("propertyId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    await cleanupOldReports();

    const gaReport = await fetchAnalytics({
      propertyId: parsed.propertyId,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });

    const record = await createReportRecord({
      title: parsed.title,
      propertyId: parsed.propertyId,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });

    await Promise.all([
      storeRawResponse(record.id, gaReport.raw),
      storeNormalizedData(record.id, gaReport),
    ]);

    const ai = await generateInsights({
      title: parsed.title,
      dateRange: { start: parsed.startDate, end: parsed.endDate },
      totals: gaReport.totals,
      timeseries: gaReport.timeseries,
    });

    await storeAiInsight(record.id, ai.summary, ai.model);
    revalidatePath("/");

    return { success: true, reportId: record.id };
  } catch (error: unknown) {
    console.error("createReportAction error", error);
    const message =
      error instanceof Error ? error.message : "Unable to create report.";
    return { error: message };
  }
}

export async function regenerateInsightsAction(reportId: string) {
  try {
    const bundle = await fetchReportBundle(reportId);
    if (!bundle) throw new Error("Report not found.");

    const ai = await generateInsights({
      title: bundle.report.title,
      dateRange: { start: bundle.report.start_date, end: bundle.report.end_date },
      totals: bundle.totals,
      timeseries: bundle.timeseries.map((row) => ({
        date: row.dimension_value,
        metrics: row.metrics,
      })),
    });

    await storeAiInsight(reportId, ai.summary, ai.model);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("regenerateInsightsAction error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to regenerate AI insights.";
    return { error: message };
  }
}
