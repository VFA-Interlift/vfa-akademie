/**
 * Client für die Wix-Website-Kurse (CMS-Sammlung „Schulungen"/Import3),
 * bereitgestellt über die HTTP-Function `get_appKurse` der Website.
 * Die Website ist damit die führende Quelle für den Kurskalender —
 * Cobra bleibt vorerst ausgeblendet.
 */

export type WixKurs = {
  id: string;
  title: string;
  bereich: string;
  kursart: string;
  kurscode: string;
  kurscodeAnzeige: string;
  /** Anzeige-Text, z. B. „02.02.2027 08:30 bis 03.02.2027 13:00 und …" */
  startdatum: string;
  ortFirma: string;
  strasse: string;
  plz: string;
  ort: string;
  dozent1?: string;
  dozent2?: string;
  dozent3?: string;
  dozent4?: string;
  /** Hospitierende Dozenten (Freitext, mehrere mit Komma getrennt). */
  hospitation?: string;
  preisVfaMitglied: number | null;
  preisVmaMitglied: number | null;
  preisNichtmitglied: number | null;
};

const WIX_BASE_URL = process.env.WIX_SITE_BASE_URL ?? "https://www.vfa-interlift.de";

export async function fetchWixKurse(): Promise<WixKurs[]> {
  const secret = process.env.WIX_WEBHOOK_SECRET;
  if (!secret) throw new Error("WIX_WEBHOOK_SECRET ist nicht konfiguriert.");

  const res = await fetch(`${WIX_BASE_URL}/_functions/appKurse`, {
    headers: { "x-app-secret": secret },
    // Kurse ändern sich selten – 5 Minuten Cache reicht und schont die Website.
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Wix-Kurse nicht erreichbar (${res.status})`);

  const data = (await res.json()) as { ok?: boolean; kurse?: WixKurs[] };
  if (!data.ok || !Array.isArray(data.kurse)) throw new Error("Wix-Kurse: unerwartete Antwort.");

  return data.kurse;
}

export type KursTerminBlock = { date: Date; endDate: Date | null };

/**
 * Zerlegt den Anzeige-Text in Termin-Blöcke. Mehrteilige Kurse (z. B. EFK:
 * „02.02.2027 10:45 bis 05.02.2027 16:30 und 09.03.2027 … bis …") sind mit
 * „und" getrennt → jeder Block wird ein eigener Kalendereintrag, damit die
 * Zeit dazwischen nicht fälschlich als durchgehende Schulung erscheint.
 * Innerhalb eines Blocks: erster Datums-Treffer = Start, letzter = Ende.
 */
export function parseKursBlocks(startdatum: string): KursTerminBlock[] {
  const toDate = (m: RegExpMatchArray) =>
    new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));

  const blocks: KursTerminBlock[] = [];
  for (const segment of String(startdatum ?? "").split(/\bund\b/i)) {
    const matches = [...segment.matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)];
    if (matches.length === 0) continue;
    const dates = matches.map(toDate).sort((a, b) => a.getTime() - b.getTime());
    blocks.push({
      date: dates[0],
      endDate: dates.length > 1 && dates[dates.length - 1].getTime() !== dates[0].getTime()
        ? dates[dates.length - 1]
        : null,
    });
  }
  return blocks.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Erster Termin-Block (Start/Ende) – für Listen, die nur einen Termin zeigen. */
export function parseKursDates(startdatum: string): { date: Date | null; endDate: Date | null } {
  const blocks = parseKursBlocks(startdatum);
  if (blocks.length === 0) return { date: null, endDate: null };
  return { date: blocks[0].date, endDate: blocks[0].endDate };
}

/** Dozenten-Namen (Felder Dozent 1–4) als Liste. */
export function kursDozentenOf(kurs: WixKurs): string[] {
  return [kurs.dozent1, kurs.dozent2, kurs.dozent3, kurs.dozent4]
    .map((d) => String(d ?? "").trim())
    .filter(Boolean);
}

/** Hospitierende Dozenten als Liste (Komma-getrennt im Feld „Hospitation"). */
export function kursHospitationOf(kurs: WixKurs): string[] {
  return String(kurs.hospitation ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

/** Adresse „Firma, Straße, PLZ Ort" für die Ortsanzeige. */
export function kursLocationOf(kurs: WixKurs): string | null {
  const cityLine = [kurs.plz, kurs.ort].filter(Boolean).join(" ").trim();
  const parts = [kurs.ortFirma, kurs.strasse, cityLine].map((p) => String(p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Kategorie aus dem Website-Feld „bereich" ableiten. */
export function kursCategoryOf(bereich: string): string {
  const b = String(bereich ?? "").toLowerCase();
  if (b.includes("vdi")) return "VDI";
  if (b.includes("efk")) return "Elektrotechnik";
  if (b.includes("praxis")) return "Praxis";
  return "Schwerpunkte";
}
