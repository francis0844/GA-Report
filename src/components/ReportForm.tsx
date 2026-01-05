"use client";

import { useEffect, useMemo } from "react";
import { useFormState } from "react-dom";
import { createReportAction } from "@/app/actions";

const initialState = { success: false as boolean, reportId: "" };

export function ReportForm() {
  const [state, formAction] = useFormState(createReportAction, initialState);

  const defaultRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }, []);

  useEffect(() => {
    if (state?.success) {
      // FormState resets automatically on successful server action re-render.
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-blue-500/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Generate</p>
          <h2 className="text-lg font-semibold text-white">New GA4 Report</h2>
        </div>
        <span className="px-3 py-1 text-xs rounded-full bg-blue-900/60 text-blue-100 border border-blue-700/40">
          Immutable
        </span>
      </div>

      <label className="block text-sm text-slate-200 mb-2">Report title</label>
      <input
        name="title"
        required
        placeholder="Weekly pulse"
        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        <label className="block text-sm text-slate-200 mb-2">GA4 property ID</label>
        <input
          name="propertyId"
          required
          placeholder="e.g. 123456789"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="block text-sm text-slate-200 mb-2">Start</label>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={defaultRange.start}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-2">End</label>
          <input
            type="date"
            name="endDate"
            required
            defaultValue={defaultRange.end}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-semibold py-2.5 shadow-lg shadow-blue-500/30 transition hover:shadow-blue-400/40"
      >
        Generate report
      </button>

      <p className="mt-3 text-xs text-slate-500">
        Raw GA responses + normalized metrics are stored. Reports auto-delete after 365 days. AI
        analysis is regeneratable.
      </p>
    </form>
  );
}
