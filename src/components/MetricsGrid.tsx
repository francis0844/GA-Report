"use client";

import { MetricChange } from "@/app/generate/types";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = {
  metrics: MetricChange[];
  currentRange: { start: string; end: string };
  comparisonRange: { start: string; end: string };
};

export function MetricsGrid({ metrics, currentRange, comparisonRange }: Props) {
  if (!metrics?.length) return null;

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm text-slate-100">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Current: {currentRange.start} → {currentRange.end}
        </span>
        <span>
          Comparison: {comparisonRange.start} → {comparisonRange.end}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
          const isUp = m.absChange >= 0;
          const Arrow = isUp ? ArrowUpRight : ArrowDownRight;
          const pctText = `${m.pctChange.toFixed(1)}%`;
          return (
            <div
              key={m.metric}
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 shadow-sm shadow-slate-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{m.metric}</p>
                <span
                  className={`flex items-center gap-1 text-xs ${
                    isUp ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <Arrow size={14} />
                  {pctText}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-xl font-semibold text-white">
                  {m.current.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500">
                  vs {m.comparison.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Change: {m.absChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
