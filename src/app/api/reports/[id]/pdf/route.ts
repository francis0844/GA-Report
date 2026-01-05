export const runtime = "nodejs";

import { buildReportPdf } from "@/lib/pdf";
import { fetchReportBundle } from "@/lib/reports";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const bundle = await fetchReportBundle(params.id);
  if (!bundle) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const pdf = await buildReportPdf(bundle);
  const body = Buffer.from(pdf);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"report-${bundle.report.id}.pdf\"`,
    },
  });
}
