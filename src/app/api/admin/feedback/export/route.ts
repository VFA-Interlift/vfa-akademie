import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ExcelJS from "exceljs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminFeedbackEvaluation } from "@/lib/feedback/evaluation";

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

function answerToCell(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "string") return value;
  return "";
}

function sanitizeSheetName(name: string, fallback: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28);
  return cleaned || fallback;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId") ?? undefined;
  const evaluation = await getAdminFeedbackEvaluation(trainingId || undefined);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VFA-Akademie";
  workbook.created = new Date();

  // Übersichtsblatt
  const overview = workbook.addWorksheet("Übersicht");
  overview.columns = [
    { header: "Schulung", key: "title", width: 44 },
    { header: "Code", key: "code", width: 16 },
    { header: "Typ", key: "type", width: 12 },
    { header: "Antworten", key: "count", width: 11 },
    { header: "Ø Gesamt", key: "avg", width: 11 },
  ];
  overview.getRow(1).font = { bold: true };

  for (const training of evaluation) {
    overview.addRow({
      title: training.displayTitle,
      code: training.trainingCode ?? "",
      type: training.formType === "INHOUSE" ? "Inhouse" : "Öffentlich",
      count: training.responseCount,
      avg: training.overallAverage ?? "",
    });
  }

  // Pro Schulung ein Antwortenblatt (eine Zeile je Abgabe)
  const usedNames = new Set<string>(["Übersicht"]);
  evaluation.forEach((training, idx) => {
    const baseName = sanitizeSheetName(training.displayTitle, `Schulung ${idx + 1}`);
    let name = baseName;
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `${baseName.slice(0, 25)} ${suffix++}`;
    }
    usedNames.add(name);

    const sheet = workbook.addWorksheet(name);
    sheet.columns = [
      { header: "Datum", key: "date", width: 18 },
      { header: "Teilnehmer/in", key: "name", width: 26 },
      ...training.questions.map((q) => ({ header: q.label, key: q.key, width: 22 })),
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { wrapText: true, vertical: "top" };

    for (const submission of training.submissions) {
      const row: Record<string, string | number> = {
        date: new Date(submission.createdAt).toLocaleString("de-DE"),
        name: submission.anonymous ? "(anonym)" : submission.participantName ?? "",
      };
      for (const q of training.questions) {
        row[q.key] = answerToCell(submission.answers[q.key]);
      }
      sheet.addRow(row);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  const filename = trainingId ? `feedback-schulung-${today}.xlsx` : `feedback-gesamt-${today}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
