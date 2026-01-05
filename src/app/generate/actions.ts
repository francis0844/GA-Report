"use server";

import { fetchAnalytics } from "@/lib/ga";
import { revalidatePath } from "next/cache";

type ActionResponse =
  | { error: string }
  | { success: true; normalized: unknown; raw: unknown };

export async function generateAnalyticsAction(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const metricsText = String(formData.get("metrics") ?? "").trim();

  if (!startDate || !endDate) return { error: "Provide start and end dates." };

  try {
    const metrics = metricsText
      ? metricsText.split(",").map((m) => m.trim()).filter(Boolean)
      : undefined;

    const result = await fetchAnalytics({
      startDate,
      endDate,
      metrics,
    });

    revalidatePath("/generate");
    return { success: true, normalized: { totals: result.totals, timeseries: result.timeseries }, raw: result.raw };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch analytics.";
    return { error: message };
  }
}
