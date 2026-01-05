"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { label: string; value: number };

type Props = {
  points: Point[];
  title?: string;
};

export function TimeseriesChart({ points, title }: Props) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 120);
    return () => clearTimeout(timer);
  }, [points]);

  const { max, coords, hasPoints } = useMemo(() => {
    const resolved = points?.length ? points : [{ label: "", value: 0 }];
    const maxValue = Math.max(...resolved.map((p) => p.value), 1);
    const width = 280;
    const height = 140;
    const gap = width / Math.max(resolved.length - 1, 1);
    const mapped = resolved.map((p, idx) => ({
      x: idx * gap,
      y: height - (p.value / maxValue) * height,
    }));
    return { max: maxValue, coords: mapped, hasPoints: Boolean(points?.length) };
  }, [points]);

  if (!hasPoints) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-sm text-slate-400">
        No timeseries data captured.
      </div>
    );
  }

  const path = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{title ?? "Sessions trend"}</span>
        <span className="text-xs text-slate-500">peak {max.toLocaleString()}</span>
      </div>
      <svg viewBox="0 0 280 150" className="mt-2 w-full overflow-visible">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L ${coords.at(-1)?.x ?? 280} 150 L 0 150 Z`}
          fill="url(#areaFill)"
          className="transition-opacity duration-700"
          style={{ opacity: animate ? 1 : 0 }}
        />
        <path
          d={path}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={3}
          className="transition-all duration-700"
          style={{ strokeDasharray: 1000, strokeDashoffset: animate ? 0 : 1000 }}
        />
        {coords.map((c, idx) => (
          <circle
            key={idx}
            cx={c.x}
            cy={c.y}
            r={4}
            className="fill-white/90 transition-all duration-500"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? "scale(1)" : "scale(0.5)",
              transformOrigin: `${c.x}px ${c.y}px`,
            }}
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        {points.map((p) => (
          <span key={p.label} className="px-2 py-1 rounded-full bg-slate-800/60">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
