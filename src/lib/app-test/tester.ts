/**
 * Wer zur Testrunde gehoert - also Begruessung auf der Startseite und den
 * Fragebogen unter Einstellungen sieht.
 *
 * Die Namen stehen hier fest im Code, damit niemand dafuer an Vercel muss.
 * Wer jemanden aufnehmen oder streichen will, aendert diese Liste; die
 * Aenderung wird mit dem naechsten Deploy wirksam.
 *
 * Soll es schneller gehen, kann die Umgebungsvariable TESTER_EMAILS gesetzt
 * werden (Adressen durch Komma getrennt) - sie ersetzt die Liste dann
 * vollstaendig und wirkt ohne Deploy. Ist sie nicht gesetzt, gilt die Liste.
 *
 * Keine Spalte in der Datenbank: die Runde ist voruebergehend.
 */
const TESTRUNDE = [
  "kristin.hemker@vfa-interlift.de",
  "tobias.doehring@vfa-interlift.de",
];

function liste(): string[] {
  const ausUmgebung = (process.env.TESTER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (ausUmgebung.length > 0) return ausUmgebung;

  return TESTRUNDE.map((e) => e.trim().toLowerCase());
}

export function istTester(email: string | null | undefined): boolean {
  if (!email) return false;
  return liste().includes(email.trim().toLowerCase());
}

export function anzahlTester(): number {
  return liste().length;
}
