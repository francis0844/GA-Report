import { ReportForm } from "@/components/ReportForm";
import { ReportList } from "@/components/ReportList";
import { cleanupOldReports, fetchReports, ReportBundle } from "@/lib/reports";

async function loadReports() {
  await cleanupOldReports();
  const reports = await fetchReports(5);
  return reports;
}

export default async function Home() {
  let loadError = "";
  let reports: ReportBundle[] = [];

  try {
    reports = await loadReports();
  } catch (error: unknown) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load reports. Check env values.";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_25%)]" />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">GA4 + Supabase</p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              Weekly & Monthly Analytics Report
            </h1>
            <p className="text-slate-400 mt-2">
              Immutable reports with stored raw responses, animated charts, AI narratives, and PDF
              export.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            Auto deletes reports older than <span className="font-semibold">365 days</span>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <ReportForm />
          <div>
            {loadError ? (
              <div className="rounded-2xl border border-red-900 bg-red-950/50 text-red-100 px-4 py-3">
                {loadError}
              </div>
            ) : (
              <ReportList reports={reports} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
