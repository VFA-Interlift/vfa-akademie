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
  fehler: { kurscode: string; message: string }[];
  nachgezogen: NachziehErgebnis;
  syncedAt: string;
};

type NachziehErgebnis = {
  geprueft: number;
  zugeordnet: number;
  eingeschrieben: number;
  fehlgeschlagen: number;
};

/**
 * Ordnet Website-Anmeldungen nach, deren Kurs beim Eingang noch nicht in der
 * App war. Der Wix-Webhook matcht nur im Moment des Eingangs — Kurse entstehen
 * aber oft erst danach (nächtlicher Sync, neue Jahrgänge). So hingen 16
 * A1-2604-Anmeldungen (nachgetragen am Vorabend des ersten Sync-Laufs) und
 * eine YLD-2704-Anmeldung dauerhaft ohne Schulung in der Luft — ohne
 * Einschreibung, Zertifikat oder Credits (Befund 13.08.2026).
 */
async function offeneAnmeldungenNachziehen(): Promise<NachziehErgebnis> {
  const offene = await prisma.cobraTrainingParticipant.findMany({
    where: { participantType: "WIX_WEBSITE", trainingId: null },
    select: { id: true, caption: true, email: true, raw: true },
  });

  let zugeordnet = 0;
  let eingeschrieben = 0;
  const fehler: { id: string; message: string }[] = [];

  for (const eintrag of offene) {
    // Ein kaputter Eintrag (oder eine P2002-Race mit dem parallel eintreffenden
    // Wix-Webhook) darf nicht alle folgenden Anmeldungen blockieren — gleiche
    // Hausregel wie im zeilenweisen Cobra-Abgleich (sync-enrollments). Eintrag
    // überspringen, Rest weiterlaufen (20.08.2026).
    try {
      const roh = eintrag.raw as { kurscode?: unknown } | null;
      const kurscode =
        (typeof roh?.kurscode === "string" && roh.kurscode.trim()) ||
        (eintrag.caption?.trim() ?? "");
      if (!kurscode) continue;

      // Bewusst das älteste Training bei gleichem Code: An ihm hängen die
      // bestehenden Einschreibungen und Zertifikate.
      const training = await prisma.training.findFirst({
        where: { code: { equals: kurscode, mode: "insensitive" } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!training) continue;

      await prisma.cobraTrainingParticipant.update({
        where: { id: eintrag.id },
        data: { trainingId: training.id },
      });
      zugeordnet += 1;

      // Wie im Wix-Webhook: Ein bereits bestätigtes Konto wird sofort
      // eingeschrieben; unbestätigte bleiben außen vor.
      if (eintrag.email) {
        const user = await prisma.user.findUnique({
          where: { email: eintrag.email },
          select: { id: true, emailVerifiedAt: true },
        });
        if (user?.emailVerifiedAt) {
          await prisma.enrollment.upsert({
            where: { userId_trainingId: { userId: user.id, trainingId: training.id } },
            create: { userId: user.id, trainingId: training.id, status: "CONFIRMED" },
            update: {},
          });
          // Wie im Wix-Webhook: Eine neue Website-Anmeldung holt eine
          // stornierte Einschreibung zurück (Befund 05.09.2026).
          await prisma.enrollment.updateMany({
            where: {
              userId: user.id,
              trainingId: training.id,
              status: { in: ["CANCELLED", "NO_SHOW"] },
            },
            data: { status: "CONFIRMED" },
          });
          eingeschrieben += 1;
        }
      }
    } catch (error) {
      fehler.push({
        id: eintrag.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (zugeordnet > 0) {
    console.log("WIX_SYNC_ANMELDUNGEN_NACHGEZOGEN", { zugeordnet, eingeschrieben });
  }
  if (fehler.length > 0) {
    console.error("WIX_SYNC_NACHZIEHEN_FEHLER", { count: fehler.length, items: fehler });
  }

  return {
    geprueft: offene.length,
    zugeordnet,
    eingeschrieben,
    fehlgeschlagen: fehler.length,
  };
}

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
  const fehler: { kurscode: string; message: string }[] = [];

  for (const kurs of kurse) {
    // Ein einzelner kaputter Kurs (oder ein kurzer DB-Aussetzer) darf nicht den
    // ganzen nächtlichen Lauf abbrechen: Sonst bleiben alle folgenden Kurse bis
    // zum nächsten Tag unsynchronisiert und das Nachziehen der Anmeldungen
    // unten entfällt komplett. Kurs überspringen, Rest weiterlaufen — gleiche
    // Hausregel wie im Cobra-Abgleich (sync-enrollments) (20.08.2026).
    try {
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
    } catch (error) {
      // kurscode kann bei kaputten Wix-Datensätzen auch kein String sein —
      // deshalb defensiv in einen String gezwungen statt .trim() zu vertrauen.
      fehler.push({
        kurscode: String(kurs?.kurscodeAnzeige || kurs?.title || kurs?.kurscode || "?"),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Übersprungene Kurse tauchen sonst nur in der HTTP-Antwort auf, die beim
  // nächtlichen Cron-Lauf niemand liest — sie würden also lautlos in der App
  // fehlen. Als Fehler geloggt, damit sie in den Vercel-Logs auffindbar sind.
  if (skipped.length > 0) {
    console.error("WIX_SYNC_UEBERSPRUNGEN", {
      count: skipped.length,
      items: skipped,
    });
  }

  // Gesammelt statt je Kurs geloggt, damit ein Blick in die Vercel-Logs den
  // ganzen Lauf zeigt (20.08.2026).
  if (fehler.length > 0) {
    console.error("WIX_SYNC_FEHLER", { count: fehler.length, items: fehler });
  }

  // Jetzt existieren die Kurse — Anmeldungen nachziehen, die vor ihrem Kurs
  // eingegangen sind. Eigenes try: Selbst wenn das Nachziehen als Ganzes
  // scheitert, soll der Sync sein Ergebnis melden statt mit 500 zu enden.
  let nachgezogen: NachziehErgebnis = {
    geprueft: 0,
    zugeordnet: 0,
    eingeschrieben: 0,
    fehlgeschlagen: 0,
  };
  try {
    nachgezogen = await offeneAnmeldungenNachziehen();
  } catch (error) {
    console.error("WIX_SYNC_NACHZIEHEN_ABGEBROCHEN", error);
  }

  return {
    received: kurse.length,
    created,
    updated,
    skipped,
    fehler,
    nachgezogen,
    syncedAt: new Date().toISOString(),
  };
}
