import { fetchWixKurse, kursDozentenOf, kursHospitationOf } from "@/lib/wix/kurse";

export type InstructorIdentity = {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
};

export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Zerlegt ein Dozentenfeld in einzelne Personen. Die Website führt dort teils
 * mehrere Namen in einem Feld ("Peter Müller, Anna Peters"). Ohne diese
 * Trennung konnte ein Vorname der einen und ein Nachname der anderen Person
 * gemeinsam einen Treffer erzeugen — und damit fremde Kurse freischalten.
 */
function splitPersons(field: string): string[] {
  return field
    .split(/[,;/&]|\bund\b/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Name in Wörter zerlegen (Leerzeichen und Bindestrich trennen). */
function woerter(value: string): string[] {
  return normalizeName(value).split(/[\s-]+/).filter(Boolean);
}

/**
 * Prüft, ob der Nutzer in einem Dozentenfeld steht. Innerhalb einer einzelnen
 * Person werden ganze Wörter verglichen: Titel ("Dr. Max Mustermann") und
 * Doppelnamen ("Meyer-Schmidt") bleiben Treffer, weil jedes Wort des Vor- und
 * Nachnamens im Feld stehen muss — aber „Jan Meyer" trifft nicht mehr
 * „Benjamin Meyer", wie es der frühere Teilstring-Vergleich tat (Befund
 * f12-10, 05.09.2026).
 */
export function isInstructorMatch(
  dozentField: string,
  identity: InstructorIdentity
): boolean {
  for (const person of splitPersons(dozentField)) {
    const feld = woerter(person);
    if (feld.length === 0) continue;
    const enthaelt = (parts: string[]) =>
      parts.length > 0 && parts.every((part) => feld.includes(part));

    if (identity.firstName && identity.lastName) {
      const first = woerter(identity.firstName);
      const last = woerter(identity.lastName);
      if (enthaelt(first) && enthaelt(last)) {
        return true;
      }
    }

    if (identity.name) {
      const parts = woerter(identity.name);
      if (parts.length >= 2 && enthaelt(parts)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Alle Kurscodes (Großschreibung), bei denen der Nutzer auf der Website als
 * Dozent oder Hospitant eingetragen ist. Grundlage jeder Zugriffsprüfung im
 * Dozentenbereich — es gibt keine ID-Verknüpfung zwischen App-Nutzer und
 * Website-Kurs, nur diese Namenszuordnung.
 *
 * Wirft, wenn die Website nicht erreichbar ist. Aufrufer müssen das als
 * "Zugriff nicht feststellbar" behandeln und ablehnen, nicht durchlassen.
 */
export async function getInstructorKurscodes(
  identity: InstructorIdentity
): Promise<Set<string>> {
  const kurse = await fetchWixKurse();
  const codes = new Set<string>();

  for (const kurs of kurse) {
    const felder = [...kursDozentenOf(kurs), ...kursHospitationOf(kurs)];
    if (!felder.some((feld) => isInstructorMatch(feld, identity))) continue;

    const code = String(kurs.kurscode ?? "").trim().toUpperCase();
    if (code) codes.add(code);
  }

  return codes;
}

/**
 * Kurscode aus dem Rohdatensatz einer Website-Anmeldung. Ersatzweise
 * kurscodeAnzeige — so nimmt es auch der Webhook (wix-anmeldung, Z. 56);
 * sonst hing eine Anmeldung am Training, war aber in keiner Liste sichtbar
 * (Befund f12-22, 05.09.2026).
 */
export function participantKurscode(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const r = raw as { kurscode?: unknown; kurscodeAnzeige?: unknown };
  const wert = typeof r.kurscode === "string" && r.kurscode.trim() ? r.kurscode : r.kurscodeAnzeige;
  return String(wert ?? "").trim().toUpperCase();
}
