/**
 * Client für die Wix-Website-Anmeldungen (CMS-Sammlung „Schulungsanmeldung"),
 * bereitgestellt über die HTTP-Function `appAnmeldungen` der Website
 * (Gegenstück zu `appKurse` für die Kurse).
 *
 * Damit wird die Website zum einzigen Trichter: sowohl der COBRA-Massenexport
 * (dort eingespielt) als auch die laufenden Formular-Buchungen liegen in dieser
 * Collection, und die App zieht regelmäßig alles herunter. Der Einzel-Webhook
 * `wix-anmeldung` bleibt für die sofortige Übernahme neuer Absendungen bestehen.
 */

export type WixAnmeldungRaw = Record<string, unknown>;

export type NormalizedWixAnmeldung = {
  /** Stabile Wix-_id der Collection-Zeile (Basis für idempotentes Upsert). */
  anmeldungId: string | null;
  kurscode: string;
  kurscodeAnzeige: string | null;
  kursTitel: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
};

const WIX_BASE_URL = process.env.WIX_SITE_BASE_URL ?? "https://www.vfa-interlift.de";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string | null {
  if (typeof value !== "string") {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

/** Erster nicht-leerer Treffer aus mehreren möglichen Feldnamen. */
function pick(raw: WixAnmeldungRaw, keys: string[]): string | null {
  for (const key of keys) {
    const v = clean(raw[key]);
    if (v) return v;
  }
  return null;
}

/**
 * Feld-Mapper für die Collection „Schulungsanmeldung" (Import4).
 *
 * WICHTIG: Der/die Teilnehmer:in steht in `t1Vorname`/`t1Nachname`/`t1Email`
 * (vom Kunden bestätigt). Die Felder `vorname`/`nachname` enthalten eine andere
 * Rolle (Anmelder/Buchungskontakt) und werden bewusst NICHT herangezogen, sonst
 * würde die falsche Person eingetragen. Der Kurscode steht im Feld `schulung`.
 * Die _id der Wix-Zeile dient als stabiler, idempotenter Schlüssel.
 */
export function normalizeWixAnmeldung(raw: WixAnmeldungRaw): NormalizedWixAnmeldung | null {
  // Velo mappt `schulung` -> `kurscode`; beide Namen werden akzeptiert.
  const kurscode = pick(raw, ["kurscode", "schulung", "kurscodeAnzeige"]);
  const firstName = pick(raw, ["t1Vorname"]);
  const lastName = pick(raw, ["t1Nachname"]);

  if (!kurscode || !firstName || !lastName) return null;

  const rawEmail = pick(raw, ["t1Email"]);
  const email = rawEmail && EMAIL_RE.test(rawEmail.toLowerCase()) ? rawEmail.toLowerCase() : null;

  return {
    anmeldungId: pick(raw, ["anmeldungId", "_id", "id"]),
    kurscode,
    kurscodeAnzeige: pick(raw, ["kurscodeAnzeige"]) ?? kurscode,
    kursTitel: pick(raw, ["kursTitel"]),
    firstName,
    lastName,
    email,
    company: pick(raw, ["firma"]),
  };
}

export async function fetchWixAnmeldungen(): Promise<WixAnmeldungRaw[]> {
  const secret = process.env.WIX_WEBHOOK_SECRET;
  if (!secret) throw new Error("WIX_WEBHOOK_SECRET ist nicht konfiguriert.");

  const res = await fetch(`${WIX_BASE_URL}/_functions/appAnmeldungen`, {
    headers: { "x-app-secret": secret },
    // Anmeldungen sollen zeitnah ankommen, aber die Website nicht fluten.
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Wix-Anmeldungen nicht erreichbar (${res.status})`);

  const data = (await res.json()) as { ok?: boolean; anmeldungen?: WixAnmeldungRaw[]; items?: WixAnmeldungRaw[] };
  const list = data.anmeldungen ?? data.items;
  if (!data.ok || !Array.isArray(list)) throw new Error("Wix-Anmeldungen: unerwartete Antwort.");

  return list;
}
