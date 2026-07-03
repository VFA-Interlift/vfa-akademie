import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatCertificateKind,
  getCertificateKindByCode,
  normalizeCertificateCode,
} from "@/lib/certificates/templates";
import { isLikelyInhouse } from "@/lib/trainings/format";
import { fetchWixKurse, kursCategoryOf, kursLocationOf, parseKursDates } from "@/lib/wix/kurse";

export const dynamic = "force-dynamic";

function guessCategory(code: string | null, title: string) {
  const normalizedCode = String(code ?? "").toUpperCase();
  const normalizedTitle = title.toLowerCase();

  if (["A1", "A2", "B", "C"].includes(normalizedCode)) {
    return "VDI";
  }

  if (normalizedCode.includes("EFK") || normalizedTitle.includes("elektro")) {
    return "Elektrotechnik";
  }

  if (
    normalizedCode.includes("SICH") ||
    normalizedCode.includes("DGUV") ||
    normalizedCode.includes("FPFW")
  ) {
    return "Praxis";
  }

  return "Schwerpunkte";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Primärquelle: die Kurse der Website (Wix-CMS „Schulungen") — dort werden
 * Termine und Orte gepflegt. Credits werden über den Kurscode aus der
 * App-DB gematcht. Cobra-Trainings sind im Kalender vorerst ausgeblendet.
 */
async function loadWixTrainings() {
  const [kurse, dbTrainings] = await Promise.all([
    fetchWixKurse(),
    prisma.training.findMany({ select: { id: true, code: true, creditsAward: true } }),
  ]);

  const creditsByCode = new Map<string, number>();
  for (const t of dbTrainings) {
    const code = String(t.code ?? "").trim().toUpperCase();
    if (code) creditsByCode.set(code, t.creditsAward);
  }

  return kurse
    .map((kurs) => {
      const { date, endDate } = parseKursDates(kurs.startdatum);
      if (!date) return null;

      const code = kurs.kurscode.trim() || null;
      const normalizedCode = normalizeCertificateCode(code ?? "");
      const certificateKind = normalizedCode ? getCertificateKindByCode(normalizedCode) : null;

      return {
        id: `wix-${kurs.id}`,
        title: kurs.title || kurs.kurscodeAnzeige || code || "Schulung",
        code,
        category: kursCategoryOf(kurs.bereich),
        certificateKind,
        certificateKindLabel: formatCertificateKind(certificateKind),
        date: date.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        location: kursLocationOf(kurs),
        instructor: null as string | null,
        description: null as string | null,
        creditsAward: creditsByCode.get(String(code ?? "").toUpperCase()) ?? 0,
        isPublic: true,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Fallback (nur wenn die Website nicht erreichbar ist): Cobra-Trainings aus der DB. */
async function loadDbTrainings() {
  const trainings = await prisma.training.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      code: true,
      certificateKind: true,
      date: true,
      endDate: true,
      location: true,
      instructor: true,
      description: true,
      creditsAward: true,
    },
  });

  return trainings
    .filter((training) => !isLikelyInhouse(training.title, training.code))
    .map((training) => ({
      id: training.id,
      title: training.title,
      code: training.code,
      category: guessCategory(training.code, training.title),
      certificateKind: training.certificateKind,
      certificateKindLabel: formatCertificateKind(training.certificateKind),
      date: training.date.toISOString(),
      endDate: training.endDate ? training.endDate.toISOString() : null,
      location: training.location,
      instructor: training.instructor,
      description: training.description,
      creditsAward: training.creditsAward,
      isPublic: true,
    }));
}

export async function GET() {
  try {
    let trainings;
    let source = "wix";

    try {
      trainings = await loadWixTrainings();
    } catch {
      // Website nicht erreichbar → auf die App-DB (Cobra) zurückfallen,
      // damit der Kalender nie leer ist.
      trainings = await loadDbTrainings();
      source = "db-fallback";
    }

    return NextResponse.json({
      ok: true,
      source,
      updatedAt: new Date().toISOString(),
      trainings,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "PUBLIC_TRAININGS_LOAD_FAILED",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
