import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { OAuth2Client } from "google-auth-library";
import { parseISO, format } from "date-fns";

export type GaRow = {
  date: string;
  metrics: Record<string, number>;
};

export type GaReportResult = {
  raw: unknown;
  totals: { metric: string; value: number }[];
  timeseries: GaRow[];
};

type FetchAnalyticsInput = {
  propertyId?: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
  dimensions?: string[];
};

function getAuthClient() {
  const clientId = process.env.GA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GA_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GA_OAUTH_REFRESH_TOKEN;
  const redirectUri = process.env.GA_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GA OAuth credentials. Please set GA_OAUTH_CLIENT_ID, GA_OAUTH_CLIENT_SECRET, and GA_OAUTH_REFRESH_TOKEN."
    );
  }

  const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  oauthClient.setCredentials({ refresh_token: refreshToken });
  return oauthClient;
}

function normalizeMetrics(metrics?: string[]) {
  if (!metrics?.length) {
    return ["sessions", "totalUsers", "eventCount", "conversions"].map((m) => ({
      name: m,
    }));
  }
  return metrics.map((m) => ({ name: m }));
}

function normalizeDimensions(dimensions?: string[]) {
  if (!dimensions?.length) return [{ name: "date" }];
  return dimensions.map((d) => ({ name: d }));
}

export async function fetchAnalytics({
  propertyId,
  startDate,
  endDate,
  metrics,
  dimensions,
}: FetchAnalyticsInput): Promise<GaReportResult> {
  const property = propertyId ?? process.env.GA4_PROPERTY_ID;
  if (!property) {
    throw new Error("Missing GA4 property ID. Set GA4_PROPERTY_ID in env.");
  }

  const authClient = getAuthClient();
  const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });

  const metricDefs = normalizeMetrics(metrics);
  const dimensionDefs = normalizeDimensions(dimensions);

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${property}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensionDefs,
    metrics: metricDefs,
  });

  const totalsMap: Record<string, number> = {};
  metricDefs.forEach((m) => (totalsMap[m.name] = 0));

  const timeseries: GaRow[] =
    response.rows?.map((row) => {
      const dimension = row.dimensionValues?.[0]?.value ?? "";
      const parsedDate = parseISO(parseISOFromGA(dimension));
      const formattedDate = isNaN(parsedDate.getTime())
        ? startDate
        : format(parsedDate, "yyyy-MM-dd");

      const metricsRecord: Record<string, number> = {};
      metricDefs.forEach((metric, index) => {
        const rawValue = row.metricValues?.[index]?.value ?? "0";
        const numeric = Number(rawValue);
        metricsRecord[metric.name] = Number.isNaN(numeric) ? 0 : numeric;
        totalsMap[metric.name] += metricsRecord[metric.name];
      });

      return {
        date: formattedDate,
        metrics: metricsRecord,
      };
    }) ?? [];

  const totals = Object.entries(totalsMap).map(([metric, value]) => ({
    metric,
    value,
  }));

  return { raw: response, totals, timeseries };
}

function parseISOFromGA(dateString: string) {
  if (!dateString) return new Date().toISOString().slice(0, 10);
  const iso = `${dateString.slice(0, 4)}-${dateString.slice(
    4,
    6
  )}-${dateString.slice(6, 8)}`;
  return iso;
}
