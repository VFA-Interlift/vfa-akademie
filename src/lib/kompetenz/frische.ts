/**
 * Fachkunde-Frische: Wissen aus einer Schulung veraltet. Diese Datei legt fest,
 * wie lange eine Kompetenz nach dem Kurs als "aktuell" gilt, und liefert daraus
 * eine Ampel für den Kompetenzpass.
 *
 * WICHTIG (Haftung): Das ist ein Erinnerungs-Hilfsmittel, KEIN amtlicher
 * Befähigungsnachweis. Ob eine Fachkunde noch gültig ist, beurteilt der
 * Arbeitgeber (z. B. nach TRBS 1203). Die Ampel darf nirgends so dargestellt
 * werden, als ersetze sie diese Beurteilung.
 *
 * Die Fristen sind bewusst konservativ gesetzt. Sicherheitsrelevante Fachkunde
 * (Elektro, Prüfungen, Gefährdungsbeurteilung) altert schneller als
 * Grundlagenwissen.
 */

const MONAT = 1000 * 60 * 60 * 24 * 30.44;

// Kürzel, deren Fachkunde besonders sicherheitsrelevant ist — kürzere Frist.
const SICHERHEIT_PRAEFIXE = ["EFK", "DGUV", "SICH", "BETR", "GEF", "ARB", "FPFW"];

const FRIST_SICHERHEIT_MONATE = 24;
const FRIST_STANDARD_MONATE = 36;
// Ab so vielen Monaten vor Ablauf wird die Ampel gelb.
const VORWARNUNG_MONATE = 6;

export type FrischeStatus = "gruen" | "gelb" | "rot";

export type Frische = {
  status: FrischeStatus;
  fristMonate: number;
  ablaufDatum: Date;
  monateBisAblauf: number;
  label: string;
};

function fristMonateFuer(code: string | null | undefined): number {
  const c = String(code ?? "").trim().toUpperCase();
  return SICHERHEIT_PRAEFIXE.some((p) => c.startsWith(p))
    ? FRIST_SICHERHEIT_MONATE
    : FRIST_STANDARD_MONATE;
}

/**
 * Bewertet, wie frisch eine Kompetenz zum Stichtag ist. `erworbenAm` ist das
 * Kursende, nicht das Ausstellungsdatum des Zertifikats: das läge bei
 * nachgezogenen Alt-Kursen erst am Tag des Ausstellungslaufs (20.08.2026).
 * `jetzt` wird hereingereicht, damit die Funktion rein und testbar bleibt.
 */
export function bewerteFrische(
  code: string | null | undefined,
  erworbenAm: Date,
  jetzt: Date
): Frische {
  const fristMonate = fristMonateFuer(code);
  const ablaufDatum = new Date(erworbenAm.getTime() + fristMonate * MONAT);
  // Aufgerundet (ceil): solange die Frist läuft, zeigt die Ampel mindestens
  // "in 1 Mon."; gerundet stand kurz vor Ablauf verwirrend "in 0 Mon." (20.08.2026)
  const monateBisAblauf = Math.ceil((ablaufDatum.getTime() - jetzt.getTime()) / MONAT);

  let status: FrischeStatus;
  let label: string;
  if (jetzt >= ablaufDatum) {
    status = "rot";
    label = "Auffrischung empfohlen";
  } else if (monateBisAblauf <= VORWARNUNG_MONATE) {
    status = "gelb";
    label = `Auffrischung in ${monateBisAblauf} Mon.`;
  } else {
    status = "gruen";
    label = "Aktuell";
  }

  return { status, fristMonate, ablaufDatum, monateBisAblauf, label };
}

export const FRISCHE_FARBE: Record<FrischeStatus, { fg: string; bg: string }> = {
  gruen: { fg: "#1c7d54", bg: "rgba(28,125,84,0.10)" },
  gelb: { fg: "#8a6d00", bg: "rgba(255,193,0,0.14)" },
  rot: { fg: "#b00020", bg: "rgba(176,0,32,0.09)" },
};
