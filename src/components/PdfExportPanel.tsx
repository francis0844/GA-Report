"use client";

import { useEffect, useState, useTransition } from "react";
import { loadReportsForPdf, PdfReportPayload } from "@/app/reports/export-actions";
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { MetricChange, AiAnalysis } from "@/app/generate/types";

type Props = {
  initialSelected?: string[];
};

export function PdfExportPanel({ initialSelected = [] }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [reports, setReports] = useState<PdfReportPayload[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedIds(initialSelected);
  }, [initialSelected]);

  const loadData = () => {
    if (!selectedIds.length) {
      setStatus("Select at least one report in the table above.");
      return;
    }
    setStatus("");
    startTransition(async () => {
      const res = await loadReportsForPdf(selectedIds);
      if (!res.success || !res.reports) {
        setStatus(res.error ?? "Unable to load reports for PDF.");
      } else {
        setReports(res.reports);
      }
    });
  };

  const hasPreview = reports.length > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">PDF Export</p>
          <h3 className="text-lg font-semibold text-white">Export selected reports</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {isPending ? "Loading..." : "Preview PDF"}
          </button>
          {hasPreview ? (
            <PDFDownloadLink
              document={<PdfDocument reports={reports} />}
              fileName="reports.pdf"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-blue-500"
            >
              {({ loading }) => (loading ? "Preparing..." : "Download PDF")}
            </PDFDownloadLink>
          ) : null}
        </div>
      </div>
      {status ? (
        <p className="text-xs text-amber-300">{status}</p>
      ) : null}
      {hasPreview ? (
        <div className="h-[480px] border border-slate-800 rounded-lg overflow-hidden">
          <PDFViewer width="100%" height="100%">
            <PdfDocument reports={reports} />
          </PDFViewer>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Select reports and click Preview to render a PDF.</p>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, fontFamily: "Helvetica" },
  section: { marginBottom: 14 },
  heading: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  subheading: { fontSize: 12, fontWeight: 600, marginBottom: 4 },
  row: { display: "flex", flexDirection: "row", gap: 6 },
  metricCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 8,
    width: "48%",
  },
});

function PdfDocument({ reports }: { reports: PdfReportPayload[] }) {
  return (
    <Document>
      {reports.map((report) => (
        <Page size="A4" style={styles.page} key={report.id}>
          <View style={styles.section}>
            <Text style={styles.heading}>{report.title}</Text>
            <Text>
              Range: {report.start_date} → {report.end_date} | Comparison:{" "}
              {report.comparison_start_date ?? "?"} → {report.comparison_end_date ?? "?"}
            </Text>
          </View>

          <MetricsSummary metrics={report.metrics} />
          <AiSection analysis={report.analysis} />
        </Page>
      ))}
    </Document>
  );
}

function MetricsSummary({ metrics }: { metrics: MetricChange[] }) {
  return (
    <View style={[styles.section]}>
      <Text style={styles.subheading}>Metrics Summary</Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        {metrics.map((m) => (
          <View key={m.metric} style={styles.metricCard}>
            <Text style={{ fontWeight: 700 }}>{m.metric}</Text>
            <Text>Current: {m.current}</Text>
            <Text>Comparison: {m.comparison}</Text>
            <Text>Abs change: {m.absChange.toFixed(2)}</Text>
            <Text>Pct change: {m.pctChange.toFixed(2)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AiSection({ analysis }: { analysis?: AiAnalysis | null }) {
  if (!analysis) {
    return (
      <View style={styles.section}>
        <Text style={styles.subheading}>AI Analysis</Text>
        <Text>No AI analysis stored.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.subheading}>AI Analysis</Text>
      {analysis.summary ? <Text style={{ marginBottom: 4 }}>{analysis.summary}</Text> : null}
      {analysis.perMetric?.length ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontWeight: 600 }}>Per metric</Text>
          {analysis.perMetric.map((p) => (
            <Text key={p.metric}>
              {p.metric}: {p.insight} (impact: {p.impact})
            </Text>
          ))}
        </View>
      ) : null}
      {analysis.anomalies?.length ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontWeight: 600 }}>Anomalies</Text>
          {analysis.anomalies.map((a, idx) => (
            <Text key={idx}>• {a}</Text>
          ))}
        </View>
      ) : null}
      {analysis.seoRecommendations?.length ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontWeight: 600 }}>SEO Recommendations</Text>
          {analysis.seoRecommendations.map((r, idx) => (
            <Text key={idx}>• {r}</Text>
          ))}
        </View>
      ) : null}
      {analysis.technicalRecommendations?.length ? (
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontWeight: 600 }}>Technical Recommendations</Text>
          {analysis.technicalRecommendations.map((r, idx) => (
            <Text key={idx}>• {r}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
