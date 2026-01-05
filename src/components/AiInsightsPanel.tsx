"use client";

import { useTransition, useState } from "react";
import { regenerateAnalysisAction } from "@/app/reports/analysis-actions";
import { AiAnalysis } from "@/app/generate/types";
import { RefreshCw } from "lucide-react";

type Props = {
  reportId: string | null;
  analysis: AiAnalysis | null;
};

export function AiInsightsPanel({ reportId, analysis }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localAnalysis, setLocalAnalysis] = useState<AiAnalysis | null>(analysis);
  const [status, setStatus] = useState<string>("");

  const data = localAnalysis ?? analysis;

  const regenerate = () => {
    if (!reportId) {
      setStatus("Select a report to regenerate AI analysis.");
      return;
    }
    setStatus("");
    startTransition(async () => {
      const res = await regenerateAnalysisAction(reportId);
      if (!res.success) {
        setStatus(res.error ?? "Failed to regenerate AI analysis.");
      } else {
        setLocalAnalysis(res.analysis ?? null);
        setStatus("AI analysis regenerated.");
      }
    });
  };

  if (!reportId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        Select a report to view AI insights.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">AI Insights</p>
          <h3 className="text-lg font-semibold text-white">Analysis & Recommendations</h3>
        </div>
        <button
          onClick={regenerate}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-100 hover:border-blue-500 disabled:opacity-60"
        >
          <RefreshCw size={14} />
          {isPending ? "Regenerating..." : "Regenerate AI Analysis"}
        </button>
      </div>

      {data ? (
        <div className="space-y-3">
          {data.summary ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Summary</p>
              <p className="text-sm text-white">{data.summary}</p>
            </div>
          ) : null}

          {data.perMetric?.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <p className="text-xs text-slate-400">Per metric</p>
              {data.perMetric.map((item) => (
                <div key={item.metric} className="rounded border border-slate-800/70 p-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.metric}</p>
                  <p className="text-sm text-white">{item.insight}</p>
                  <p className="text-xs text-slate-400">Impact: {item.impact}</p>
                </div>
              ))}
            </div>
          ) : null}

          {data.anomalies?.length ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-200">Anomalies</p>
              <ul className="list-disc list-inside text-sm text-amber-100 space-y-1">
                {data.anomalies.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.seoRecommendations?.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">SEO recommendations</p>
              <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
                {data.seoRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.technicalRecommendations?.length ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs text-slate-400">Technical recommendations</p>
              <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
                {data.technicalRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No AI analysis yet for this report.</p>
      )}

      {status ? <p className="text-xs text-amber-300">{status}</p> : null}
    </div>
  );
}
