import { AppShell } from "@/components/AppShell";
import { getMissingEnvVars } from "@/lib/env";

export default async function GeneratePage() {
  const missingEnv = getMissingEnvVars();

  return (
    <AppShell missingEnv={missingEnv}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Generate Report</h3>
        <p className="text-sm text-slate-300">
          This page will handle GA4 OAuth, Supabase persistence, and AI analysis once you supply the
          required environment variables. For now, it is intentionally empty to keep the UI stable.
        </p>
        {missingEnv.length ? (
          <p className="mt-4 rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
            Provide the missing env values to enable report generation: {missingEnv.join(", ")}.
          </p>
        ) : (
          <p className="mt-4 rounded-lg border border-emerald-600/50 bg-emerald-600/10 px-4 py-3 text-emerald-50 text-sm">
            Env ready. Next step is wiring GA4 fetch, Supabase storage, and AI processing.
          </p>
        )}
      </div>
    </AppShell>
  );
}
