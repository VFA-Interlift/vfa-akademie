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
  // Die drei Dozenten aus der Einladung zur Testphase vom 06.07.2026. Ohne
  // diese Zeilen sehen sie den Fragebogen unter Einstellungen nicht — und die
  // Erinnerungsmail liefe ins Leere. Wer sich mit einer ANDEREN Adresse in der
  // App registriert hat, faellt weiterhin durch; dann gehoert die genutzte
  // Adresse hier hinein.
  "robert.makarun@mliftconsulting.com",
  "sascha.goebel@email.de",
  "volker-sepanski@t-online.de",
  // Die ersten drei Teilnehmer-Tester (Tobi, 20.08.2026) — alle auch zum YLD
  // angemeldet.
  "lisa.wallisch@hissmekano.de",
  "h.f.lutz@outlook.de",
  "m.molineus@henning-gmbh.de",
  // Marcel Puttrus-Kowollik (Tobi, 20.08.2026) — hat TGE verlassen, private
  // Adresse; seine Kurse (VDI A1/A2/B/C, YLD) hängen in Cobra noch an
  // marcel.puttrus@tge-gruppe.de und werden nach der Registrierung von Hand
  // verknüpft.
  "marcel@puttrus.de",
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
