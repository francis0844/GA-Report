"use client";

import { useEffect, useState } from "react";

type BarDatum = { label: string; value: number; emphasis?: boolean };

type Props = {
  data: BarDatum[];
  title?: string;
};

export function AnimatedBarChart({ data, title }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(timer);
  }, [data]);

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {title ? (
        <div className="flex items-center justify-between text-sm font-medium text-slate-200">
          <span>{title}</span>
          <span className="text-slate-400">Totals</span>
        </div>
      ) : null}
      <div className="space-y-2">
        {data.map((item) => {
          const width = `${(item.value / max) * 100}%`;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className={item.emphasis ? "font-semibold text-white" : ""}>
                  {item.label}
                </span>
                <span className="tabular-nums text-slate-200">
                  {item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-700 ease-out"
                  style={{ width: ready ? width : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
