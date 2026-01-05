import { AppShell } from "@/components/AppShell";
import { ReportsTable } from "@/components/ReportsTable";
import { AiInsightsPanel } from "@/components/AiInsightsPanel";
import { ReportCharts } from "@/components/ReportCharts";
import { type AiAnalysis } from "@/app/generate/types";
import { getMissingEnvVars } from "@/lib/env";
import { fetchReportSummaries, fetchReportNormalized, ReportSummary } from "@/lib/reports";

export default async function ReportsPage() {
  const missingEnv = getMissingEnvVars();

  let summaries: ReportSummary[] = [];
  let errorMessage = "";
  let normalized: Record<string, unknown> | null = null;
  let primaryReportId: string | null = null;

  if (!missingEnv.length) {
    try {
      summaries = await fetchReportSummaries(50);
      primaryReportId = summaries[0]?.id ?? null;
      if (primaryReportId) {
        const norm = await fetchReportNormalized(primaryReportId);
        normalized = norm.normalized_metrics;
      }
    } catch (error: unknown) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to load reports. Check Supabase settings.";
    }
  }

  return (
    <AppShell missingEnv={missingEnv}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Reports Log</h3>
            <p className="text-sm text-slate-300">
              View generated reports and delete entries as needed.
            </p>
          </div>
        </div>
        {missingEnv.length ? (
          <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
            Configure env values to unlock the reports log: {missingEnv.join(", ")}.
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-red-100 text-sm">
            {errorMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <ReportsTable summaries={summaries} />
            <AiInsightsPanel
              reportId={summaries[0]?.id ?? null}
              analysis={(summaries[0]?.ai_analysis as AiAnalysis | null) ?? null}
            />
            <ReportCharts
              reportId={primaryReportId}
              normalized={normalized as Record<string, unknown> | null}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
