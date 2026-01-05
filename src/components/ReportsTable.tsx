"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { deleteReportsAction } from "@/app/reports/actions";
import { ReportSummary } from "@/lib/reports";
import { AlertTriangle } from "lucide-react";

type Props = {
  summaries: ReportSummary[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
};

export function ReportsTable({ summaries, selectedIds, onSelectionChange }: Props) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(() => {
    if (selectedIds) return new Set(selectedIds);
    return internalSelected;
  }, [selectedIds, internalSelected]);

  const allSelected = useMemo(
    () => summaries.length > 0 && selected.size === summaries.length,
    [selected, summaries]
  );

  const toggleAll = () => {
    if (allSelected) {
      setInternalSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const ids = summaries.map((s) => s.id);
      setInternalSelected(new Set(ids));
      onSelectionChange?.(ids);
    }
  };

  const toggleOne = (id: string) => {
    setInternalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  const onDelete = () => {
    if (!selected.size) {
      setStatus("Select at least one report to delete.");
      return;
    }
    const confirmed = window.confirm(
      `Delete ${selected.size} report(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteReportsAction(Array.from(selected));
      if (result?.error) {
        setStatus(result.error);
      } else {
        setStatus("Deleted. Refreshing…");
        setSelected(new Set());
      }
    });
  };

  if (!summaries.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-6 text-sm text-slate-300">
        No reports yet. Generate a report to see it listed here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {selected.size} selected • {summaries.length} total
        </div>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="rounded-lg bg-red-600 text-white text-sm px-3 py-2 hover:bg-red-500 disabled:opacity-60"
        >
          {isPending ? "Deleting..." : "Delete selected"}
        </button>
      </div>
      {status ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-amber-100 text-sm">
          <AlertTriangle size={14} />
          <span>{status}</span>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
              </th>
              <th className="px-3 py-3 text-left">Title</th>
              <th className="px-3 py-3 text-left">Type</th>
              <th className="px-3 py-3 text-left">Range</th>
              <th className="px-3 py-3 text-left">Comparison</th>
              <th className="px-3 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50 text-sm">
            {summaries.map((report) => (
              <tr key={report.id} className="hover:bg-slate-800/60">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${report.title}`}
                    checked={selected.has(report.id)}
                    onChange={() => toggleOne(report.id)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  />
                </td>
                <td className="px-3 py-2 text-white">{report.title}</td>
                <td className="px-3 py-2 capitalize text-slate-200">{report.type}</td>
                <td className="px-3 py-2 text-slate-200">
                  {report.start_date} → {report.end_date}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {report.comparison_start_date && report.comparison_end_date
                    ? `${report.comparison_start_date} → ${report.comparison_end_date}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {format(new Date(report.created_at), "PP p")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
