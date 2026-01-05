"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { regenerateInsightsAction } from "@/app/actions";
import { AnimatedBarChart } from "./AnimatedBarChart";
import { TimeseriesChart } from "./TimeseriesChart";
import { ReportBundle } from "@/lib/reports";
import { format } from "date-fns";

type Props = {
  reports: ReportBundle[];
};

export function ReportList({ reports }: Props) {
  if (!reports?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400">
        No reports yet. Generate your first GA4 report to visualize performance.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map((bundle) => (
        <ReportCard key={bundle.report.id} bundle={bundle} />
      ))}
    </div>
  );
}

function ReportCard({ bundle }: { bundle: ReportBundle }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");

  const latestInsight = useMemo(() => {
    return (
      bundle.insights
        ?.slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] ?? null
    );
  }, [bundle.insights]);

  const timeseriesPoints = useMemo(() => {
    return bundle.timeseries.map((row) => ({
      label: format(new Date(row.dimension_value), "MM/dd"),
      value: row.metrics.sessions ?? 0,
    }));
  }, [bundle.timeseries]);

  const totalBars = useMemo(
    () =>
      bundle.totals.map((t) => ({
        label: t.metric,
        value: t.value,
        emphasis: ["sessions", "totalUsers", "purchaseRevenue"].includes(t.metric),
      })),
    [bundle.totals]
  );

  const onRegenerate = () => {
    setStatus("");
    startTransition(async () => {
      const result = await regenerateInsightsAction(bundle.report.id);
      if (result?.error) setStatus(result.error);
      else setStatus("AI insights regenerated");
    });
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-blue-500/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Report</p>
          <h3 className="text-xl font-semibold text-white">{bundle.report.title}</h3>
          <p className="text-sm text-slate-400">
            Property {bundle.report.property_id} | {bundle.report.start_date} →{" "}
            {bundle.report.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/reports/${bundle.report.id}/pdf`}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-blue-500"
          >
            Export PDF
          </Link>
          <button
            onClick={onRegenerate}
            disabled={isPending}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold px-3 py-2 text-sm shadow-lg shadow-amber-500/30 disabled:opacity-50"
          >
            {isPending ? "Recomputing..." : "Regenerate AI"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AnimatedBarChart title="Totals" data={totalBars} />
        <TimeseriesChart title="Sessions trend" points={timeseriesPoints} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-300">AI insights</p>
          <span className="text-xs text-slate-500">
            {latestInsight
              ? `Last generated ${format(new Date(latestInsight.created_at), "PPp")}`
              : "Not generated"}
          </span>
        </div>
        <div className="text-sm text-slate-200 whitespace-pre-line leading-6">
          {latestInsight?.summary ?? "Awaiting AI output"}
        </div>
        {status ? <p className="mt-2 text-xs text-amber-400">{status}</p> : null}
      </div>
    </div>
  );
}
