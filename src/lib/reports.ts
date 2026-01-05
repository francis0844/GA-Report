import { format } from "date-fns";
import { GaReportResult } from "./ga";
import { getSupabaseClient } from "./supabase";

export type ReportRecord = {
  id: string;
  title: string;
  property_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

export type AiInsight = {
  id: number;
  report_id: string;
  summary: string;
  model: string | null;
  created_at: string;
};

export type ReportBundle = {
  report: ReportRecord;
  totals: { metric: string; value: number }[];
  timeseries: { dimension_value: string; metrics: Record<string, number> }[];
  insights: AiInsight[];
};

type ReportRow = ReportRecord & {
  ai_insights?: AiInsight[];
  report_totals?: { metric: string; value: number }[];
  report_timeseries?: { dimension_value: string; metrics: Record<string, number> }[];
};

type TotalRow = { metric: string; value: number | string };
type TimeseriesRow = { dimension_value: string; metrics: Record<string, number> };

type CreateReportInput = {
  title: string;
  propertyId: string;
  startDate: string;
  endDate: string;
};

export async function cleanupOldReports() {
  const supabase = getSupabaseClient();
  await supabase.rpc("purge_old_reports");
}

export async function createReportRecord(input: CreateReportInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      title: input.title,
      property_id: input.propertyId,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "ready",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create report record");
  }

  return data as ReportRecord;
}

export async function storeRawResponse(reportId: string, raw: unknown) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("ga_raw_responses")
    .insert({ report_id: reportId, raw_payload: raw });

  if (error) throw new Error(error.message);
}

export async function storeNormalizedData(
  reportId: string,
  ga: GaReportResult
) {
  const supabase = getSupabaseClient();

  const totalsPayload = ga.totals.map((item) => ({
    report_id: reportId,
    metric: item.metric,
    value: item.value,
  }));

  const timeseriesPayload = ga.timeseries.map((row) => ({
    report_id: reportId,
    dimension_value: row.date,
    metrics: row.metrics,
  }));

  const [totalsResult, timeseriesResult] = await Promise.all([
    supabase.from("report_totals").insert(totalsPayload),
    supabase.from("report_timeseries").insert(timeseriesPayload),
  ]);

  if (totalsResult.error) throw new Error(totalsResult.error.message);
  if (timeseriesResult.error) throw new Error(timeseriesResult.error.message);
}

export async function storeAiInsight(
  reportId: string,
  summary: string,
  model: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_insights")
    .insert({ report_id: reportId, summary, model })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to save AI");
  return data as AiInsight;
}

export async function fetchReports(limit = 5): Promise<ReportBundle[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, ai_insights(*), report_totals(*), report_timeseries(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (
    data?.map((row: ReportRow) => ({
      report: {
        id: row.id,
        title: row.title,
        property_id: row.property_id,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        created_at: row.created_at,
      },
      totals:
        row.report_totals?.map((t: TotalRow) => ({
          metric: t.metric,
          value: Number(t.value),
        })) ?? [],
      timeseries:
        row.report_timeseries?.map((t: TimeseriesRow) => ({
          dimension_value: format(new Date(t.dimension_value), "yyyy-MM-dd"),
          metrics: t.metrics ?? {},
        })) ?? [],
      insights:
        row.ai_insights?.map((insight: AiInsight) => ({
          id: insight.id,
          report_id: insight.report_id,
          summary: insight.summary,
          model: insight.model,
          created_at: insight.created_at,
        })) ?? [],
    })) ?? []
  );
}

export async function fetchReportBundle(
  reportId: string
): Promise<ReportBundle | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*, ai_insights(*), report_totals(*), report_timeseries(*)")
    .eq("id", reportId)
    .single();

  if (error || !data) return null;

  return {
    report: {
      id: data.id,
      title: data.title,
      property_id: data.property_id,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      created_at: data.created_at,
    },
    totals:
      data.report_totals?.map((t: TotalRow) => ({
        metric: t.metric,
        value: Number(t.value),
      })) ?? [],
    timeseries:
      data.report_timeseries?.map((t: TimeseriesRow) => ({
        dimension_value: format(new Date(t.dimension_value), "yyyy-MM-dd"),
        metrics: t.metrics ?? {},
      })) ?? [],
    insights:
      data.ai_insights?.map((insight: AiInsight) => ({
        id: insight.id,
        report_id: insight.report_id,
        summary: insight.summary,
        model: insight.model,
        created_at: insight.created_at,
      })) ?? [],
  };
}
