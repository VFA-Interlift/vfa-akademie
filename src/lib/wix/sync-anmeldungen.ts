import { prisma } from "@/lib/prisma";
import { fetchWixAnmeldungen, normalizeWixAnmeldung, type NormalizedWixAnmeldung } from "@/lib/wix/anmeldungen";

export type WixAnmeldungenSyncResult = {
  received: number;
  normalized: number;
  skipped: number;
  created: number;
  updated: number;
  linkedToTraining: number;
  enrolled: number;
  syncedAt: string;
};

/**
 * Idempotenter Schlüssel je Anmeldung — identisch zum Einzel-Webhook
 * (`wix-anmeldung`), damit Bulk-Sync und Webhook auf denselben Datensatz
 * upserten und keine Duplikate entstehen.
 */
function stagingId(a: NormalizedWixAnmeldung): string {
  if (a.anmeldungId) return `wix-${a.anmeldungId}`;
  const kurscodeSlug = a.kurscode.toLowerCase().replace(/[^a-z0-9]+/gi, "_");
  const personKey = a.email ?? `${a.firstName} ${a.lastName}`.toLowerCase().replace(/[^a-zà-ÿ0-9]+/gi, "_");
  return `wix-${personKey}-${kurscodeSlug}`;
}

/**
 * Lädt die komplette Wix-Collection „Schulungsanmeldung" und übernimmt jede
 * Zeile als Staging-Teilnehmer (CobraTrainingParticipant, participantType
 * WIX_WEBSITE). trainingId wird per Kurscode verknüpft, sofern die Schulung in
 * der App-DB existiert; bestehende App-Konten werden eingeschrieben. Nichts
 * wird gelöscht. Mehrfach ausführbar (Upsert).
 */
export async function syncWixAnmeldungen(): Promise<WixAnmeldungenSyncResult> {
  const rows = await fetchWixAnmeldungen();

  const normalized: NormalizedWixAnmeldung[] = [];
  for (const row of rows) {
    const item = normalizeWixAnmeldung(row);
    if (item) normalized.push(item);
  }

  // Kurscode -> Training einmal vorladen (case-insensitiv), spart N Queries.
  const codes = [...new Set(normalized.map((a) => a.kurscode.toUpperCase()))];
  const trainings = codes.length
    ? await prisma.training.findMany({
        where: { code: { in: codes, mode: "insensitive" } },
        select: { id: true, code: true, title: true },
      })
    : [];
  const trainingByCode = new Map(trainings.map((t) => [String(t.code ?? "").toUpperCase(), t]));

  let created = 0;
  let updated = 0;
  let linkedToTraining = 0;
  let enrolled = 0;

  for (const a of normalized) {
    const training = trainingByCode.get(a.kurscode.toUpperCase()) ?? null;
    const id = stagingId(a);
    const participantText = `${a.firstName} ${a.lastName}`;
    const raw = {
      kurscode: a.kurscode,
      kurscodeAnzeige: a.kurscodeAnzeige,
      kursTitel: a.kursTitel,
      t1Vorname: a.firstName,
      t1Nachname: a.lastName,
      t1Email: a.email,
      firma: a.company,
      quelle: "wix-anmeldungen-sync",
    };

    const before = await prisma.cobraTrainingParticipant.findUnique({
      where: { cobraParticipantId: id },
      select: { id: true },
    });

    await prisma.cobraTrainingParticipant.upsert({
      where: { cobraParticipantId: id },
      create: {
        cobraParticipantId: id,
        cobraTrainingCaption: null,
        cobraTrainingId: null,
        trainingId: training?.id ?? null,
        caption: a.kursTitel ?? training?.title ?? a.kurscode,
        participantText,
        participantType: "WIX_WEBSITE",
        status: "ANGEMELDET",
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        company: a.company,
        raw,
      },
      update: {
        trainingId: training?.id ?? null,
        caption: a.kursTitel ?? training?.title ?? a.kurscode,
        participantText,
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        company: a.company,
        raw,
      },
    });

    if (before) updated += 1;
    else created += 1;
    if (training) linkedToTraining += 1;

    // Hat der Teilnehmer schon ein App-Konto und existiert die Schulung -> einschreiben.
    if (training && a.email) {
      const user = await prisma.user.findUnique({ where: { email: a.email }, select: { id: true } });
      if (user) {
        await prisma.enrollment.upsert({
          where: { userId_trainingId: { userId: user.id, trainingId: training.id } },
          create: { userId: user.id, trainingId: training.id, status: "PENDING" },
          update: {},
        });
        enrolled += 1;
      }
    }
  }

  return {
    received: rows.length,
    normalized: normalized.length,
    skipped: rows.length - normalized.length,
    created,
    updated,
    linkedToTraining,
    enrolled,
    syncedAt: new Date().toISOString(),
  };
}
