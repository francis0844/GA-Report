"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateAnalyticsAction, generateMockReportAction } from "@/app/generate/actions";
import { type GenerateActionResponse } from "@/app/generate/types";
import { useMemo, useState } from "react";
import { MetricsGrid } from "./MetricsGrid";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { useTransition } from "react";

const initialState: GenerateActionResponse = { success: false, error: "" };

export function GenerateForm() {
  const [state, formAction] = useFormState<GenerateActionResponse, FormData>(
    generateAnalyticsAction,
    initialState
  );
  const [mockState, setMockState] = useState<GenerateActionResponse>({ success: false, error: "" });
  const [isMockPending, startMock] = useTransition();

  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);
  const prevWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  }, []);
  const prevWeekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 8);
    return d;
  }, []);

  const [currentStart, setCurrentStart] = useState(weekAgo.toISOString().slice(0, 10));
  const [currentEnd, setCurrentEnd] = useState(today.toISOString().slice(0, 10));
  const [comparisonStart, setComparisonStart] = useState(prevWeekStart.toISOString().slice(0, 10));
  const [comparisonEnd, setComparisonEnd] = useState(prevWeekEnd.toISOString().slice(0, 10));
  const [comparisonType, setComparisonType] = useState("weekly");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">Current start date</label>
          <input
            type="date"
            name="currentStartDate"
            value={currentStart}
            onChange={(e) => setCurrentStart(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-1">Current end date</label>
          <input
            type="date"
            name="currentEndDate"
            value={currentEnd}
            onChange={(e) => setCurrentEnd(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">Comparison start date</label>
          <input
            type="date"
            name="comparisonStartDate"
            value={comparisonStart}
            onChange={(e) => setComparisonStart(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-1">Comparison end date</label>
          <input
            type="date"
            name="comparisonEndDate"
            value={comparisonEnd}
            onChange={(e) => setComparisonEnd(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-200 mb-1">Comparison type</label>
        <select
          name="comparisonType"
          value={comparisonType}
          onChange={(e) => setComparisonType(e.target.value)}
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-200 mb-1">
          Metrics (comma-separated, leave blank for default)
        </label>
        <input
          name="metrics"
          placeholder="sessions,totalUsers,eventCount,conversions"
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-slate-500">
          Supports any GA4 metric strings; defaults to sessions, totalUsers, eventCount, conversions.
        </p>
      </div>
      <SubmitButton />
      <button
        type="button"
        onClick={() =>
          startMock(async () => {
            const res = await generateMockReportAction(
              currentStart,
              currentEnd,
              comparisonStart,
              comparisonEnd,
              comparisonType
            );
            setMockState(res);
          })
        }
        disabled={isMockPending}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:border-blue-500 disabled:opacity-60"
      >
        {isMockPending ? "Generating mock..." : "Generate mock data"}
      </button>

      {"error" in state && state.error ? (
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-red-100 text-sm">
          {state.error}
        </div>
      ) : null}
      {"error" in mockState && mockState.error ? (
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-red-100 text-sm">
          {mockState.error}
        </div>
      ) : null}

      {state?.success ? (
        <div className="space-y-4">
          <MetricsGrid
            metrics={state.data.metrics}
            currentRange={state.data.currentRange}
            comparisonRange={state.data.comparisonRange}
          />
          <AiInsightsPanel reportId={state.data.reportId ?? null} analysis={state.data.analysis ?? null} />
        </div>
      ) : mockState?.success ? (
        <div className="space-y-4">
          <MetricsGrid
            metrics={mockState.data.metrics}
            currentRange={mockState.data.currentRange}
            comparisonRange={mockState.data.comparisonRange}
          />
          <AiInsightsPanel
            reportId={mockState.data.reportId ?? null}
            analysis={mockState.data.analysis ?? null}
          />
        </div>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-60"
    >
      {pending ? "Generating..." : "Generate Report"}
    </button>
  );
}
