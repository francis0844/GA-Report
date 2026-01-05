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

type FetchReportInput = {
  propertyId: string;
  startDate: string;
  endDate: string;
};

const METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "averageSessionDuration",
  "eventCount",
  "conversions",
  "purchaseRevenue",
] as const;

function getAuthClient() {
  const clientId = process.env.GA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GA_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GA_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GA OAuth credentials. Please set GA_OAUTH_CLIENT_ID, GA_OAUTH_CLIENT_SECRET, and GA_OAUTH_REFRESH_TOKEN."
    );
  }

  const oauthClient = new OAuth2Client(clientId, clientSecret);
  oauthClient.setCredentials({ refresh_token: refreshToken });
  return oauthClient;
}

export async function fetchGaReport({
  propertyId,
  startDate,
  endDate,
}: FetchReportInput): Promise<GaReportResult> {
  const authClient = getAuthClient();
  const analyticsDataClient = new BetaAnalyticsDataClient({ authClient });

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: METRICS.map((m) => ({ name: m })),
  });

  const totalsMap: Record<string, number> = {};
  METRICS.forEach((m) => (totalsMap[m] = 0));

  const timeseries: GaRow[] =
    response.rows?.map((row) => {
      const dimension = row.dimensionValues?.[0]?.value ?? "";
      const parsedDate = parseISO(parseISOFromGA(dimension));
      const formattedDate = isNaN(parsedDate.getTime())
        ? startDate
        : format(parsedDate, "yyyy-MM-dd");

      const metrics: Record<string, number> = {};
      METRICS.forEach((metric, index) => {
        const rawValue = row.metricValues?.[index]?.value ?? "0";
        const numeric = Number(rawValue);
        metrics[metric] = Number.isNaN(numeric) ? 0 : numeric;
        totalsMap[metric] += metrics[metric];
      });

      return {
        date: formattedDate,
        metrics,
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
  // GA returns YYYYMMDD
  const iso = `${dateString.slice(0, 4)}-${dateString.slice(
    4,
    6
  )}-${dateString.slice(6, 8)}`;
  return iso;
}
