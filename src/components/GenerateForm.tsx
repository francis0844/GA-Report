"use client";

import { useFormState } from "react-dom";
import { generateAnalyticsAction, type ActionResponse } from "@/app/generate/actions";
import { useMemo } from "react";

const initialState: ActionResponse = { success: false, error: "" };

export function GenerateForm() {
  const [state, formAction] = useFormState<ActionResponse, FormData>(
    generateAnalyticsAction,
    initialState
  );

  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">Start date</label>
          <input
            type="date"
            name="startDate"
            defaultValue={toDateInput(weekAgo)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-1">End date</label>
          <input
            type="date"
            name="endDate"
            defaultValue={toDateInput(today)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-white"
            required
          />
        </div>
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
      <button
        type="submit"
        className="rounded-lg bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-500/30 hover:bg-blue-500"
      >
        Generate Report
      </button>

      {"error" in state && state.error ? (
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-red-100 text-sm">
          {state.error}
        </div>
      ) : null}

      {state?.success ? (
        <div className="space-y-3 rounded-lg border border-emerald-600/60 bg-emerald-600/10 px-3 py-3 text-emerald-50 text-sm">
          <p className="font-semibold text-white">Normalized preview</p>
          <pre className="overflow-auto text-xs bg-slate-950/80 p-2 rounded">{JSON.stringify(state.normalized, null, 2)}</pre>
          <p className="font-semibold text-white">Raw GA response</p>
          <pre className="overflow-auto text-xs bg-slate-950/80 p-2 rounded">{JSON.stringify(state.raw, null, 2)}</pre>
        </div>
      ) : null}
    </form>
  );
}
