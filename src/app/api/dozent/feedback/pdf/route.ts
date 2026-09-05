import { NextResponse } from "next/server";
import { dateiKopfzeile, fehlerSeite } from "@/lib/dateikopf";
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
  // Lesbare Seiten statt JSON: Der Knopf öffnet die Route in einem eigenen
  // Tab, ein Fehler steht dort ungefiltert vor dem Dozenten (05.09.2026).
  if (!email) return fehlerSeite("Bitte melde dich an und ruf die Auswertung noch einmal auf.", 401);

  const me = await prisma.user.findUnique({
    where: { email },
    select: { isInstructor: true, role: true, firstName: true, lastName: true, name: true },
  });
  if (!me?.isInstructor && me?.role !== "ADMIN") {
    return fehlerSeite("Diese Auswertung ist nur für Dozentinnen und Dozenten zugänglich.", 403);
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId");
  if (!trainingId) return fehlerSeite("Zu diesem Aufruf fehlt die Schulung.", 400);

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { code: true, title: true, instructor: true },
  });
  if (!training) return fehlerSeite("Diese Schulung gibt es nicht.", 404);

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
      return fehlerSeite("Die Website antwortet gerade nicht, deshalb lässt sich deine Zuordnung zur Schulung nicht prüfen. Bitte versuch es später noch einmal.", 503);
    }

    if (!code || !meineKurscodes.has(code)) {
      return fehlerSeite("Du bist bei dieser Schulung nicht als Dozent hinterlegt.", 403);
    }
  }

  // Auswertung und Rendern mit Protokollzeile: Ohne sie blieb bei einem
  // Fehler nur die generische 500-Seite und die Ursache war nicht zu finden
  // (Befund f05-14, 05.09.2026).
  let pdf: Uint8Array;
  try {
    const evaluation = await getAdminFeedbackEvaluation(trainingId);
    if (evaluation.length === 0) {
      return fehlerSeite("Zu dieser Schulung liegt noch keine Rückmeldung vor.", 404);
    }
    pdf = await renderFeedbackReportPdf(evaluation);
  } catch (fehler) {
    console.error("DOZENT_FEEDBACK_PDF_ERROR", trainingId, fehler);
    return fehlerSeite("Die Auswertung ließ sich gerade nicht erzeugen. Bitte versuch es später noch einmal.", 500);
  }
  const safeName = (training.code?.trim() || training.title).replace(/[^\w-]+/g, "_");

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // Leseansicht des Geräts statt Ordner „Downloads" (05.09.2026).
      "Content-Disposition": dateiKopfzeile(`feedback-${safeName}.pdf`),
      // Personenbezogene Auswertung mit Freitexten — nicht zwischenspeichern,
      // wie bei den übrigen Dateirouten (Befund f05-13, 05.09.2026).
      "Cache-Control": "no-store",
    },
  });
}
