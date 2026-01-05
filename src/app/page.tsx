import { AppShell } from "@/components/AppShell";
import { getMissingEnvVars } from "@/lib/env";
import Link from "next/link";

export default async function Home() {
  const missingEnv = getMissingEnvVars();

  return (
    <AppShell missingEnv={missingEnv}>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Welcome</h3>
        <p className="text-sm text-slate-300">
          Module 1 sets up the project shell. Generate and Reports pages are scaffolded. We will
          wire GA, Supabase, and OpenAI after you provide the required environment variables.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href="/generate"
            className="rounded-xl bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-500/30"
          >
            Go to Generate
          </Link>
          <Link
            href="/reports"
            className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 hover:border-blue-500"
          >
            View Reports Log
          </Link>
        </div>
        {missingEnv.length ? (
          <div className="mt-5 rounded-xl border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-amber-50 text-sm">
            Missing env values detected. Please provide: {missingEnv.join(", ")}.
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-emerald-600/50 bg-emerald-600/10 px-4 py-3 text-emerald-50 text-sm">
            All required environment variables are present. Ready for next modules.
          </div>
        )}
      </div>
    </AppShell>
  );
}
