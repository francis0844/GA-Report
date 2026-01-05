import { AppShell } from "@/components/AppShell";
import { getMissingEnvVars } from "@/lib/env";

export default async function ReportsPage() {
  const missingEnv = getMissingEnvVars();

  return (
    <AppShell missingEnv={missingEnv}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Reports Log</h3>
        <p className="text-sm text-slate-300">
          Report history and PDF exports will appear here after GA4 data is ingested and stored in
          Supabase. Module 1 keeps this empty to ensure the UI renders even without env variables.
        </p>
        {missingEnv.length ? (
          <p className="mt-4 rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
            Configure env values to unlock the reports log: {missingEnv.join(", ")}.
          </p>
        ) : (
          <p className="mt-4 rounded-lg border border-emerald-600/50 bg-emerald-600/10 px-4 py-3 text-emerald-50 text-sm">
            Env ready. Next modules will add Supabase queries and PDF exports here.
          </p>
        )}
      </div>
    </AppShell>
  );
}
