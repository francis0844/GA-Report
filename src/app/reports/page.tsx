import { AppShell } from "@/components/AppShell";
import { ReportsTable } from "@/components/ReportsTable";
import { getMissingEnvVars } from "@/lib/env";
import { fetchReportSummaries } from "@/lib/reports";

export default async function ReportsPage() {
  const missingEnv = getMissingEnvVars();

  let summaries = [];
  let errorMessage = "";

  if (!missingEnv.length) {
    try {
      summaries = await fetchReportSummaries(50);
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
          <ReportsTable summaries={summaries} />
        )}
      </div>
    </AppShell>
  );
}
