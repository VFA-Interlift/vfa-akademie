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

/**
 * Zieht Start-/Enddatum aus dem Anzeige-Text („dd.MM.yyyy HH:mm bis …").
 * Erster Datums-Treffer = Start, letzter = Ende (deckt auch mehrteilige
 * Kurse wie EFK „… und 06.07.2027 …" ab).
 */
export function parseKursDates(startdatum: string): { date: Date | null; endDate: Date | null } {
  const matches = [...String(startdatum ?? "").matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)];
  if (matches.length === 0) return { date: null, endDate: null };

  const toDate = (m: RegExpMatchArray) =>
    new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));

  const dates = matches.map(toDate).sort((a, b) => a.getTime() - b.getTime());
  const date = dates[0];
  const endDate = dates.length > 1 ? dates[dates.length - 1] : null;
  return { date, endDate };
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
