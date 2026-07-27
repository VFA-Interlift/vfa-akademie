import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminFeedbackEvaluation } from "@/lib/feedback/evaluation";
import { renderFeedbackReportPdf } from "@/lib/feedback/report-pdf";
import { getInstructorKurscodes } from "@/lib/dozent/zuordnung";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Feedback-Auswertung als PDF für den Dozenten der Schulung.
 * Zugriff nur, wenn der eingeloggte Nutzer Dozentenrolle hat UND
 * namentlich als Dozent der Schulung hinterlegt ist.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { isInstructor: true, role: true, firstName: true, lastName: true, name: true },
  });
  if (!me?.isInstructor && me?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId");
  if (!trainingId) return NextResponse.json({ ok: false, error: "MISSING_TRAINING" }, { status: 400 });

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { code: true, title: true, instructor: true },
  });
  if (!training) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });

  // Nur der eigene Dozent (oder Admin) darf die Auswertung laden. Grundlage ist
  // die Dozentenzuordnung der Website, nicht das Freitextfeld `instructor` der
  // Schulung: dort standen mehrere Namen in einem Feld, wodurch ein Vorname der
  // einen und ein Nachname einer anderen Person gemeinsam einen Treffer
  // erzeugen konnten — und damit fremde Auswertungen freigaben.
  if (me.role !== "ADMIN") {
    const code = String(training.code ?? "").trim().toUpperCase();

    let meineKurscodes: Set<string>;
    try {
      meineKurscodes = await getInstructorKurscodes(me);
    } catch {
      return NextResponse.json({ ok: false, error: "WEBSITE_UNAVAILABLE" }, { status: 503 });
    }

    if (!code || !meineKurscodes.has(code)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const evaluation = await getAdminFeedbackEvaluation(trainingId);
  if (evaluation.length === 0) {
    return NextResponse.json({ ok: false, error: "NO_FEEDBACK" }, { status: 404 });
  }

  const pdf = await renderFeedbackReportPdf(evaluation);
  const safeName = (training.code?.trim() || training.title).replace(/[^\w-]+/g, "_");

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="feedback-${safeName}.pdf"`,
    },
  });
}
