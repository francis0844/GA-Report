import { AppShell } from "@/components/AppShell";
import { GenerateForm } from "@/components/GenerateForm";
import { getMissingEnvVars } from "@/lib/env";

export default async function GeneratePage() {
  const missingEnv = getMissingEnvVars();

  return (
    <AppShell missingEnv={missingEnv}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Generate Report</h3>
            <p className="text-sm text-slate-300">
              Authenticate with GA, pick a date range, and fetch analytics. We return raw + normalized data.
            </p>
          </div>
          <a
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-100 hover:border-blue-500"
            href="/api/google/oauth/start"
          >
            Start Google OAuth
          </a>
        </div>
        {missingEnv.length ? (
          <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
            Provide missing env values before generating: {missingEnv.join(", ")}.
          </div>
        ) : (
          <GenerateForm />
        )}
      </div>
    </AppShell>
  );
}
