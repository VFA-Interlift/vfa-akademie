import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { defaultCreditsFor } from "@/lib/trainings/credit-defaults";
import { getCertificateKindByCode } from "@/lib/certificates/templates";

/**
 * Einmaliger Import der Schulungshistorie aus zwei Cobra-Exporten:
 *
 *  1. Schulungen — Spalten: ID der Schulung | Titel | Startdatum | Enddatum |
 *     Veranstaltungsart | Terminart | Preis VFA | Preis VMA | Preis Andere | Schulungsort
 *
 *  2. Teilnehmer — nach Schulung gruppiert. Vor jeder Gruppe steht eine Kopfzeile
 *     "Schulung - ID: 107 - GRUNDKURS A1-2403" in der ersten Spalte, danach die
 *     Teilnehmerzeilen: Firma | Nachname | Vorname | E-Mail | Telefon | Art
 *
 * Der Import erzeugt bewusst KEINE Enrollments. Die entstehen über den
 * bestehenden Weg: Bei der Registrierung zieht `api/register` alle
 * Teilnehmerzeilen mit passender E-Mail nach, und der Admin-Abgleich holt
 * Bestandsnutzer nach. So gibt es nur einen Mechanismus statt zweier.
 */

/** Teilnehmerarten, die keine echte Teilnahme sind und nicht importiert werden. */
const KEINE_TEILNAHME = [
  /^x_/i, // x_Dozent, x_Hospitant, x_Inhouse-Bucher
  /absage/i,
  /platz geblockt/i,
  /storno/i,
];

export type SchulungRoh = {
  cobraId: string;
  titel: string;
  code: string;
  start: Date;
  ende: Date | null;
  ort: string | null;
  terminart: string | null;
};

export type TeilnehmerRoh = {
  schulungCobraId: string;
  vorname: string;
  nachname: string;
  email: string | null;
  firma: string | null;
  art: string | null;
};

export type ImportBericht = {
  schulungen: {
    gelesen: number;
    ohneDatum: number;
    mitTeilnehmern: number;
    neu: number;
    aktualisiert: number;
  };
  teilnehmer: {
    gelesen: number;
    uebersprungen: number;
    uebersprungenNachArt: Record<string, number>;
    ohneEmail: number;
    ohneSchulung: number;
    neu: number;
    aktualisiert: number;
  };
  personen: number;
  warnungen: string[];
  beispiele: Array<{ cobraId: string; code: string; titel: string; start: string; teilnehmer: number }>;
};

function zelle(row: ExcelJS.Row, spalte: number): string {
  const v = row.getCell(spalte).value;
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as { text?: unknown; result?: unknown };
    return String(o.text ?? o.result ?? "").trim();
  }
  return String(v).trim();
}

function datum(row: ExcelJS.Row, spalte: number): Date | null {
  const v = row.getCell(spalte).value;
  if (v instanceof Date) return v;
  const s = zelle(row, spalte);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Zieht den Kurscode aus dem Schulungstitel.
 * "GEFÄHRDUNGSBEURTEILUNG GEF-2402" → "GEF-2402"
 * "DGUV_Aumüller Aumatic_2024"      → "DGUV"   (Inhouse ohne Terminnummer)
 */
export function codeAusTitel(titel: string): string {
  const t = titel.trim();

  const mitNummer = t.match(/([A-ZÄÖÜ0-9]{1,10}(?:\/[A-ZÄÖÜ]+)*-\d{4})\s*$/i);
  if (mitNummer) return mitNummer[1].toUpperCase();

  const inline = t.match(/\b([A-ZÄÖÜ]{2,8}\d?)\s*[-_]/);
  if (inline) return inline[1].toUpperCase();

  const erstes = t.split(/[\s_-]/)[0];
  return erstes ? erstes.toUpperCase() : "";
}

function istKeineTeilnahme(art: string | null): boolean {
  if (!art) return false;
  return KEINE_TEILNAHME.some((re) => re.test(art));
}

const istEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function leseSchulungen(buffer: ArrayBuffer): Promise<{ schulungen: SchulungRoh[]; ohneDatum: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Die Schulungsdatei enthält kein Arbeitsblatt.");

  const schulungen: SchulungRoh[] = [];
  let ohneDatum = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cobraId = zelle(row, 1).replace(/\.0$/, "");
    if (!cobraId || !/^\d+$/.test(cobraId)) continue;

    const start = datum(row, 3);
    if (!start) {
      ohneDatum += 1;
      continue;
    }

    const titel = zelle(row, 2) || `Schulung ${cobraId}`;
    schulungen.push({
      cobraId,
      titel,
      code: codeAusTitel(titel),
      start,
      ende: datum(row, 4),
      ort: zelle(row, 10) || null,
      terminart: zelle(row, 6) || null,
    });
  }

  return { schulungen, ohneDatum };
}

export async function leseTeilnehmer(buffer: ArrayBuffer): Promise<TeilnehmerRoh[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Die Teilnehmerdatei enthält kein Arbeitsblatt.");

  const teilnehmer: TeilnehmerRoh[] = [];
  let aktuelleSchulung: string | null = null;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const spalte1 = zelle(row, 1);
    const nachname = zelle(row, 2);
    const vorname = zelle(row, 3);

    const kopfzeile = spalte1.startsWith("Schulung") && !nachname && !vorname;
    if (kopfzeile) {
      const m = spalte1.match(/Schulung\s*-\s*ID:\s*(\d+)/i);
      aktuelleSchulung = m ? m[1] : null;
      continue;
    }

    if (!aktuelleSchulung) continue;
    if (!nachname && !vorname) continue;

    const email = zelle(row, 4).toLowerCase();
    teilnehmer.push({
      schulungCobraId: aktuelleSchulung,
      vorname,
      nachname,
      email: istEmail(email) ? email : null,
      firma: spalte1 || null,
      art: zelle(row, 6) || null,
    });
  }

  return teilnehmer;
}

export async function importiereHistorie(
  schulungen: SchulungRoh[],
  teilnehmer: TeilnehmerRoh[],
  opts: { schreiben: boolean }
): Promise<ImportBericht> {
  const warnungen: string[] = [];

  // Nur Schulungen anlegen, zu denen es auch Teilnehmer gibt.
  const proSchulung = new Map<string, TeilnehmerRoh[]>();
  const uebersprungenNachArt: Record<string, number> = {};
  let uebersprungen = 0;
  let ohneEmail = 0;

  for (const t of teilnehmer) {
    if (istKeineTeilnahme(t.art)) {
      const key = t.art ?? "(ohne Art)";
      uebersprungenNachArt[key] = (uebersprungenNachArt[key] ?? 0) + 1;
      uebersprungen += 1;
      continue;
    }
    if (!t.email) ohneEmail += 1;
    const liste = proSchulung.get(t.schulungCobraId) ?? [];
    liste.push(t);
    proSchulung.set(t.schulungCobraId, liste);
  }

  const nachId = new Map(schulungen.map((s) => [s.cobraId, s]));
  const relevante = [...proSchulung.keys()];

  // Bestand in zwei Abfragen laden statt pro Zeile einzeln — bei 1300+
  // Teilnehmern wären Einzelabfragen sonst der Flaschenhals und würden die
  // Route in den Timeout laufen lassen.
  const bestandSchulungen = new Map(
    (
      await prisma.training.findMany({
        where: { cobraId: { in: relevante } },
        select: { id: true, cobraId: true },
      })
    ).map((t) => [t.cobraId as string, t.id])
  );

  const alleTeilnehmerIds: string[] = [];
  for (const [cobraId, liste] of proSchulung) {
    for (const t of liste) {
      const kennung = t.email ? slug(t.email) : slug(`${t.vorname} ${t.nachname}`);
      alleTeilnehmerIds.push(`cobra-hist-${cobraId}-${kennung}`);
    }
  }

  const bestandTeilnehmer = new Set(
    (
      await prisma.cobraTrainingParticipant.findMany({
        where: { cobraParticipantId: { in: alleTeilnehmerIds } },
        select: { cobraParticipantId: true },
      })
    ).map((p) => p.cobraParticipantId)
  );

  const ohneSchulungsdaten = relevante.filter((id) => !nachId.has(id));
  if (ohneSchulungsdaten.length > 0) {
    warnungen.push(
      `${ohneSchulungsdaten.length} Schulungen aus der Teilnehmerdatei fehlen in der Schulungsdatei (IDs: ${ohneSchulungsdaten
        .slice(0, 10)
        .join(", ")}${ohneSchulungsdaten.length > 10 ? " …" : ""}). Deren Teilnehmer werden nicht importiert.`
    );
  }

  let schulungenNeu = 0;
  let schulungenAktualisiert = 0;
  let teilnehmerNeu = 0;
  let teilnehmerAktualisiert = 0;
  let ohneSchulung = 0;

  const beispiele: ImportBericht["beispiele"] = [];
  const personen = new Set<string>();

  for (const cobraId of relevante) {
    const s = nachId.get(cobraId);
    const liste = proSchulung.get(cobraId) ?? [];

    if (!s) {
      ohneSchulung += liste.length;
      continue;
    }

    if (beispiele.length < 8) {
      beispiele.push({
        cobraId: s.cobraId,
        code: s.code,
        titel: s.titel,
        start: s.start.toISOString().slice(0, 10),
        teilnehmer: liste.length,
      });
    }

    const daten = {
      title: s.titel,
      code: s.code || null,
      date: s.start,
      endDate: s.ende,
      location: s.ort,
      certificateKind: getCertificateKindByCode(s.code),
      creditsAward: defaultCreditsFor(s.code),
    };

    const vorhandeneId = bestandSchulungen.get(s.cobraId) ?? null;
    let trainingId = vorhandeneId;

    if (vorhandeneId) {
      schulungenAktualisiert += 1;
      if (opts.schreiben) {
        // Credits einer bereits gepflegten Schulung nicht überschreiben.
        await prisma.training.update({
          where: { id: vorhandeneId },
          data: { title: daten.title, date: daten.date, endDate: daten.endDate, location: daten.location },
        });
      }
    } else {
      schulungenNeu += 1;
      if (opts.schreiben) {
        const erstellt = await prisma.training.create({
          data: { cobraId: s.cobraId, ...daten },
          select: { id: true },
        });
        trainingId = erstellt.id;
      }
    }

    const schreibvorgaenge: Promise<unknown>[] = [];

    for (const t of liste) {
      const kennung = t.email ? slug(t.email) : slug(`${t.vorname} ${t.nachname}`);
      const teilnehmerId = `cobra-hist-${s.cobraId}-${kennung}`;
      personen.add(t.email ?? `${slug(t.vorname)}_${slug(t.nachname)}`);

      if (bestandTeilnehmer.has(teilnehmerId)) teilnehmerAktualisiert += 1;
      else teilnehmerNeu += 1;

      if (opts.schreiben && trainingId) {
        const feld = {
          cobraTrainingCaption: `#${s.cobraId} ${s.titel}`,
          cobraTrainingId: s.cobraId,
          trainingId,
          caption: s.titel,
          participantText: `${t.vorname} ${t.nachname}`.trim(),
          participantType: t.art ?? "HISTORIE",
          status: "HISTORIE_IMPORT",
          email: t.email,
          firstName: t.vorname || null,
          lastName: t.nachname || null,
          company: t.firma,
        };

        schreibvorgaenge.push(
          prisma.cobraTrainingParticipant.upsert({
            where: { cobraParticipantId: teilnehmerId },
            create: { cobraParticipantId: teilnehmerId, ...feld },
            update: feld,
          })
        );
      }
    }

    // Je Schulung gebündelt schreiben: schnell genug, ohne die Verbindung
    // mit über tausend gleichzeitigen Abfragen zu überlasten.
    if (schreibvorgaenge.length > 0) await Promise.all(schreibvorgaenge);
  }

  return {
    schulungen: {
      gelesen: schulungen.length,
      ohneDatum: 0,
      mitTeilnehmern: relevante.length,
      neu: schulungenNeu,
      aktualisiert: schulungenAktualisiert,
    },
    teilnehmer: {
      gelesen: teilnehmer.length,
      uebersprungen,
      uebersprungenNachArt,
      ohneEmail,
      ohneSchulung,
      neu: teilnehmerNeu,
      aktualisiert: teilnehmerAktualisiert,
    },
    personen: personen.size,
    warnungen,
    beispiele,
  };
}
