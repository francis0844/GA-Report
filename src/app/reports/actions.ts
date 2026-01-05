"use server";

import { revalidatePath } from "next/cache";
import { deleteReportsByIds } from "@/lib/reports";

export async function deleteReportsAction(ids: string[]) {
  if (!ids?.length) return { error: "No reports selected." };
  try {
    await deleteReportsByIds(ids);
    revalidatePath("/reports");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return { error: message };
  }
}
