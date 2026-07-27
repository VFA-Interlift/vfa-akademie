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

/**
 * Prüft, ob der Nutzer in einem Dozentenfeld steht. Innerhalb einer einzelnen
 * Person wird bewusst weiterhin per Teilstring verglichen, damit Titel
 * ("Dr. Max Mustermann") und Doppelnamen nicht zu falschen Ablehnungen führen.
 */
export function isInstructorMatch(
  dozentField: string,
  identity: InstructorIdentity
): boolean {
  for (const person of splitPersons(dozentField)) {
    const field = normalizeName(person);
    if (!field) continue;

    if (identity.firstName && identity.lastName) {
      const first = normalizeName(identity.firstName);
      const last = normalizeName(identity.lastName);
      if (first && last && field.includes(first) && field.includes(last)) {
        return true;
      }
    }

    if (identity.name) {
      const parts = normalizeName(identity.name).split(" ").filter(Boolean);
      if (parts.length >= 2 && parts.every((part) => field.includes(part))) {
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

/** Kurscode aus dem Rohdatensatz einer Website-Anmeldung. */
export function participantKurscode(raw: unknown): string {
  if (raw && typeof raw === "object" && "kurscode" in raw) {
    return String((raw as { kurscode?: unknown }).kurscode ?? "")
      .trim()
      .toUpperCase();
  }
  return "";
}
