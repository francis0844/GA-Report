"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { MetricChange } from "@/app/generate/types";

type Props = {
  reportId: string | null;
  normalized: Record<string, unknown> | null;
};

const COLORS = ["#38bdf8", "#fbbf24", "#22c55e", "#f97316", "#a855f7"];

export function ReportCharts({ reportId, normalized }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  const { metrics, currentRange, comparisonRange } = useMemo(() => {
    const payload = (normalized as {
      metrics?: MetricChange[];
      currentRange?: { start: string; end: string };
      comparisonRange?: { start: string; end: string };
    }) ?? {};
    return {
      metrics: payload.metrics ?? [],
      currentRange: payload.currentRange ?? null,
      comparisonRange: payload.comparisonRange ?? null,
    };
  }, [normalized]);

  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, [reportId, normalized]);

  useEffect(() => {
    if (metrics?.length && !selectedMetric) {
      setSelectedMetric(metrics[0].metric);
    }
  }, [metrics, selectedMetric]);

  if (!reportId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        Select a report to view charts.
      </div>
    );
  }

  if (!metrics?.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        No stored metrics for this report yet.
      </div>
    );
  }

  const selected = metrics.find((m) => m.metric === selectedMetric) ?? metrics[0];

  const trendData = [
    { label: "Comparison", value: selected.comparison },
    { label: "Current", value: selected.current },
  ];

  const comparisonData = metrics.map((m) => ({
    metric: m.metric,
    current: m.current,
    comparison: m.comparison,
  }));

  const totalCurrent = metrics.reduce((sum, m) => sum + (m.current || 0), 0);
  const pieData = metrics.map((m, idx) => ({
    name: m.metric,
    value: m.current,
    color: COLORS[idx % COLORS.length],
    pct: totalCurrent === 0 ? 0 : (m.current / totalCurrent) * 100,
  }));

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Charts</p>
          <h3 className="text-lg font-semibold text-white">Stored report visuals</h3>
          <p className="text-xs text-slate-400">
            Current: {currentRange?.start ?? "?"} → {currentRange?.end ?? "?"} • Comparison:{" "}
            {comparisonRange?.start ?? "?"} → {comparisonRange?.end ?? "?"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {metrics.map((m) => (
            <button
              key={m.metric}
              onClick={() => setSelectedMetric(m.metric)}
              className={`rounded-full border px-3 py-1 text-xs ${
                m.metric === selectedMetric
                  ? "border-blue-500 bg-blue-500/20 text-white"
                  : "border-slate-700 text-slate-300 hover:border-blue-500"
              }`}
            >
              {m.metric}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm text-slate-300 mb-2">Trend: {selected.metric}</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm text-slate-300 mb-2">Current vs Comparison</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="comparison"
                  fill="#fbbf24"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
                <Bar
                  dataKey="current"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <p className="text-sm text-slate-300 mb-2">Current distribution</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={40}
                isAnimationActive={animate}
                animationDuration={700}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const num = typeof value === "number" ? value : 0;
                  return [`${num}`, ""];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {pieData.map((p) => (
            <span key={p.name} className="rounded-full border border-slate-700 px-2 py-1">
              {p.name}: {p.pct.toFixed(1)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
