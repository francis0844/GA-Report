import { format } from "date-fns";
import {
  PDFDocument,
  PageSizes,
  PDFFont,
  PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import { ReportBundle } from "./reports";

export async function buildReportPdf(bundle: ReportBundle) {
  const doc = await PDFDocument.create();
  const cover = doc.addPage(PageSizes.A4);
  const tablePage = doc.addPage(PageSizes.A4);
  const insightPage = doc.addPage(PageSizes.A4);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  renderCover(cover, bundle, bold);
  renderChartsAndTable(tablePage, bundle, font, bold);
  renderInsights(insightPage, bundle, font, bold);

  return await doc.save();
}

function renderCover(page: PDFPage, bundle: ReportBundle, bold: PDFFont) {
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.05, 0.07, 0.12),
  });

  page.drawText("Weekly & Monthly Analytics Report", {
    x: 50,
    y: height - 120,
    size: 26,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(bundle.report.title, {
    x: 50,
    y: height - 160,
    size: 20,
    font: bold,
    color: rgb(0.8, 0.88, 1),
  });

  page.drawText(
    `Property ${bundle.report.property_id} | ${bundle.report.start_date} → ${bundle.report.end_date}`,
    { x: 50, y: height - 200, size: 14, font: bold, color: rgb(0.75, 0.82, 0.93) }
  );

  page.drawText(`Created ${format(new Date(bundle.report.created_at), "PPPp")}`, {
    x: 50,
    y: height - 230,
    size: 12,
    font: bold,
    color: rgb(0.65, 0.72, 0.82),
  });
}

function renderChartsAndTable(
  page: PDFPage,
  bundle: ReportBundle,
  font: PDFFont,
  bold: PDFFont
) {
  const { width, height } = page.getSize();
  page.drawText("Performance Snapshot", {
    x: 50,
    y: height - 60,
    size: 18,
    font: bold,
  });

  drawTimeseriesChart(page, bundle, 50, height - 360, width - 100, 220, font, bold);
  drawMetricsTable(page, bundle, 50, height - 420, width - 100, font, bold);
}

function drawTimeseriesChart(
  page: PDFPage,
  bundle: ReportBundle,
  startX: number,
  startY: number,
  width: number,
  height: number,
  font: PDFFont,
  bold: PDFFont
) {
  const series = bundle.timeseries;
  if (!series.length) {
    page.drawText("No timeseries data captured.", {
      x: startX,
      y: startY - 20,
      size: 12,
      font,
    });
    return;
  }

  const focusMetric = "sessions";
  const values = series.map((row) => row.metrics[focusMetric] ?? 0);
  const maxValue = Math.max(...values, 1);
  const barWidth = width / Math.max(series.length, 1) - 6;

  series.forEach((row, idx) => {
    const barHeight = ((row.metrics[focusMetric] ?? 0) / maxValue) * height;
    const x = startX + idx * (barWidth + 6);
    page.drawRectangle({
      x,
      y: startY - barHeight,
      width: barWidth,
      height: barHeight,
      color: rgb(0.17, 0.44, 0.88),
    });

    if (idx % 2 === 0) {
      page.drawText(format(new Date(row.dimension_value), "MM/dd"), {
        x,
        y: startY - barHeight - 14,
        size: 8,
        font,
      });
    }
  });

  page.drawText(`Sessions trend (${focusMetric})`, {
    x: startX,
    y: startY + 10,
    size: 12,
    font: bold,
  });
}

function drawMetricsTable(
  page: PDFPage,
  bundle: ReportBundle,
  startX: number,
  startY: number,
  width: number,
  font: PDFFont,
  bold: PDFFont
) {
  const rowHeight = 22;
  const headerY = startY - 30;

  page.drawText("Metric", { x: startX, y: headerY, size: 12, font: bold });
  page.drawText("Value", { x: startX + width - 120, y: headerY, size: 12, font: bold });

  bundle.totals.forEach((row, idx) => {
    const y = headerY - rowHeight * (idx + 1);
    page.drawText(row.metric, { x: startX, y, size: 11, font });
    page.drawText(row.value.toFixed(2), {
      x: startX + width - 120,
      y,
      size: 11,
      font,
    });
  });
}

function renderInsights(
  page: PDFPage,
  bundle: ReportBundle,
  font: PDFFont,
  bold: PDFFont
) {
  page.drawText("AI Insights", { x: 50, y: page.getHeight() - 60, size: 18, font: bold });
  const latestInsight = bundle.insights?.[0];
  if (!latestInsight) {
    page.drawText("No AI insights generated yet.", {
      x: 50,
      y: page.getHeight() - 100,
      size: 12,
      font,
    });
    return;
  }

  const lines = latestInsight.summary.split("\n");
  let y = page.getHeight() - 100;
  lines.forEach((line) => {
    page.drawText(line.trim(), { x: 50, y, size: 12, font });
    y -= 18;
  });

  page.drawText(`Model: ${latestInsight.model ?? "unknown"}`, {
    x: 50,
    y: y - 10,
    size: 10,
    font,
  });
}
