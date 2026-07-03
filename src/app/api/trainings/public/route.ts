import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatCertificateKind,
  getCertificateKindByCode,
  normalizeCertificateCode,
} from "@/lib/certificates/templates";
import { isLikelyInhouse } from "@/lib/trainings/format";
import { fetchWixKurse, kursCategoryOf, kursDozentenOf, kursLocationOf, parseKursBlocks } from "@/lib/wix/kurse";

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
 * Standard-Credits je Kurskürzel (synchron zu den Cobra-Sync-Regeln in
 * sync-trainings#deriveCredits). Fallback für Website-Kurse, die (noch)
 * nicht in der App-DB stehen. Sonderfälle (z. B. Lutz-Zuschlag) kommen
 * weiterhin über den DB-Match.
 */
const DEFAULT_CREDITS_BY_PREFIX: [string, number][] = [
  ["IN/SER/TR", 350],
  ["AZUBI", 20],
  ["EINST", 100],
  ["SCHALL", 150],
  ["BETR", 50],
  ["EFK", 250],
  ["A1", 150],
  ["A2", 150],
  ["PLG", 150],
  ["NUR", 50],
  ["DOK", 100],
  ["SON", 100],
  ["MVO", 100],
  ["MOD", 100],
  ["BRG", 150],
  ["GEF", 150],
  ["FRQ", 100],
  ["B", 200],
  ["C", 200],
];

function defaultCreditsFor(code: string | null): number {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return 0;
  for (const [prefix, credits] of DEFAULT_CREDITS_BY_PREFIX) {
    if (prefix.length === 1) {
      // Einbuchstabige Kürzel (B/C) nur exakt bzw. mit „-" matchen.
      if (normalized === prefix || normalized.startsWith(`${prefix}-`)) return credits;
    } else if (normalized.startsWith(prefix)) {
      return credits;
    }
  }
  return 0;
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
    .flatMap((kurs) => {
      // Mehrteilige Kurse (z. B. EFK Teil 1 + Teil 2) → ein Eintrag je Block,
      // damit der Kalender nicht die Zeit dazwischen als Schulung anzeigt.
      const blocks = parseKursBlocks(kurs.startdatum);
      if (blocks.length === 0) return [];

      const code = kurs.kurscode.trim() || null;
      const normalizedCode = normalizeCertificateCode(code ?? "");
      const certificateKind = normalizedCode ? getCertificateKindByCode(normalizedCode) : null;
      const baseTitle = kurs.title || kurs.kurscodeAnzeige || code || "Schulung";
      const dozenten = kursDozentenOf(kurs);
      const credits = creditsByCode.get(String(code ?? "").toUpperCase()) ?? defaultCreditsFor(code);

      return blocks.map((block, index) => ({
        id: `wix-${kurs.id}-${index}`,
        title: blocks.length > 1 ? `${baseTitle} – Teil ${index + 1}` : baseTitle,
        code,
        category: kursCategoryOf(kurs.bereich),
        certificateKind,
        certificateKindLabel: formatCertificateKind(certificateKind),
        date: block.date.toISOString(),
        endDate: block.endDate ? block.endDate.toISOString() : null,
        location: kursLocationOf(kurs),
        instructor: dozenten.length ? dozenten.join(" | ") : null,
        description: null as string | null,
        creditsAward: credits,
        isPublic: true,
      }));
    })
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
