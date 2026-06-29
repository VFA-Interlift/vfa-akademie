import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminFeedbackEvaluation } from "@/lib/feedback/evaluation";
import { renderFeedbackReportPdf } from "@/lib/feedback/report-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return false;
  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { role: true },
  });
  return me?.role === "ADMIN";
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId") ?? undefined;
  const evaluation = await getAdminFeedbackEvaluation(trainingId || undefined);

  const pdfBytes = await renderFeedbackReportPdf(evaluation);
  const today = new Date().toISOString().slice(0, 10);
  const filename = trainingId
    ? `feedback-schulung-${today}.pdf`
    : `feedback-gesamt-${today}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
