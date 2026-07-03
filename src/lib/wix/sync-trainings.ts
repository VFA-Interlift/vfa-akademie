import { prisma } from "@/lib/prisma";
import {
  getCertificateKindByCode,
  normalizeCertificateCode,
} from "@/lib/certificates/templates";
import { defaultCreditsFor } from "@/lib/trainings/credit-defaults";
import { fetchWixKurse, kursDozentenOf, kursLocationOf, parseKursBlocks } from "@/lib/wix/kurse";

export type WixSyncResult = {
  received: number;
  created: number;
  updated: number;
  skipped: { kurscode: string; reason: string }[];
  syncedAt: string;
};

/**
 * Übernimmt die Website-Kurse (Wix-CMS „Schulungen") in die App-DB —
 * ersetzt den Cobra-Sync als führende Quelle. Matching per Kurscode:
 * bestehende Trainings (auch ehemals aus Cobra) werden aktualisiert,
 * damit Anmeldungen/Zertifikate an denselben Datensätzen hängen bleiben.
 * Es wird nichts gelöscht.
 */
export async function syncWixTrainings(): Promise<WixSyncResult> {
  const kurse = await fetchWixKurse();

  let created = 0;
  let updated = 0;
  const skipped: { kurscode: string; reason: string }[] = [];

  for (const kurs of kurse) {
    const code = kurs.kurscode.trim();
    if (!code) {
      skipped.push({ kurscode: kurs.kurscodeAnzeige || kurs.title || "?", reason: "KEIN_KURSCODE" });
      continue;
    }

    const blocks = parseKursBlocks(kurs.startdatum);
    if (blocks.length === 0) {
      skipped.push({ kurscode: code, reason: "KEIN_DATUM" });
      continue;
    }

    // Gesamtzeitraum (erster Start bis letztes Ende) — der Kalender zeigt die
    // Einzeltermine ohnehin direkt von der Website.
    const date = blocks[0].date;
    const last = blocks[blocks.length - 1];
    const endDate = last.endDate ?? (blocks.length > 1 ? last.date : blocks[0].endDate);

    const title = kurs.title || kurs.kurscodeAnzeige || code;
    const location = kursLocationOf(kurs);
    const dozenten = kursDozentenOf(kurs);
    const instructor = dozenten.length ? dozenten.join(" | ") : null;
    const normalizedCode = normalizeCertificateCode(code);
    const certificateKind = normalizedCode ? getCertificateKindByCode(normalizedCode) : null;

    const existing = await prisma.training.findFirst({
      where: { code: { equals: code, mode: "insensitive" } },
      select: { id: true, creditsAward: true },
    });

    if (existing) {
      await prisma.training.update({
        where: { id: existing.id },
        data: {
          title,
          date,
          endDate,
          location,
          instructor,
          certificateKind,
          // Vorhandene Credits (z. B. Cobra-Sonderfälle) nicht überschreiben.
          creditsAward: existing.creditsAward > 0 ? existing.creditsAward : defaultCreditsFor(code),
        },
      });
      updated += 1;
    } else {
      await prisma.training.create({
        data: {
          title,
          code,
          date,
          endDate,
          location,
          instructor,
          certificateKind,
          creditsAward: defaultCreditsFor(code),
        },
      });
      created += 1;
    }
  }

  return {
    received: kurse.length,
    created,
    updated,
    skipped,
    syncedAt: new Date().toISOString(),
  };
}
