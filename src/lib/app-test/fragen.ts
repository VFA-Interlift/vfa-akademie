/**
 * Kurzfassung des Testfeedback-Bogens (Langfassung: docs/app-test im
 * chef-cockpit). Zehn Fragen statt fuenfunddreissig, damit der Bogen auf dem
 * Handy in zwei bis drei Minuten zu schaffen ist.
 *
 * Die Reihenfolge ist bewusst: erst der Einstieg, dann das Zurechtfinden,
 * dann Fehler, zuletzt das Gesamturteil. Pflicht ist nur die Gesamtnote.
 */

export type FrageSkala = {
  id: string;
  typ: "skala";
  text: string;
  /** Beschriftung der Skalenenden, 1 links und 5 rechts. */
  links: string;
  rechts: string;
};

export type FrageAuswahl = {
  id: string;
  typ: "auswahl";
  text: string;
  optionen: string[];
  mehrfach?: boolean;
};

export type FrageText = {
  id: string;
  typ: "text";
  text: string;
  platzhalter?: string;
};

export type Frage = FrageSkala | FrageAuswahl | FrageText;

export const APP_TEST_FRAGEN: Frage[] = [
  {
    id: "einstieg",
    typ: "skala",
    text: "Registrieren und Anmelden hat auf Anhieb geklappt.",
    links: "gar nicht",
    rechts: "voll und ganz",
  },
  {
    id: "startbildschirm",
    typ: "auswahl",
    text: "Hast du die App auf deinem Handy zum Startbildschirm hinzugefügt?",
    optionen: ["Ja", "Nein, nicht versucht", "Versucht, hat nicht geklappt"],
  },
  {
    id: "zurechtfinden",
    typ: "skala",
    text: "Ich habe mich in der App zurechtgefunden.",
    links: "gar nicht",
    rechts: "voll und ganz",
  },
  {
    id: "daten",
    typ: "skala",
    text: "Meine Schulungen und Zertifikate sind vollständig und richtig hinterlegt.",
    links: "gar nicht",
    rechts: "voll und ganz",
  },
  {
    id: "datenfehler",
    typ: "text",
    text: "Sind dir falsche oder fehlende Daten aufgefallen? Bitte so genau wie möglich.",
    platzhalter: "z. B. Schulung XY fehlt, Name falsch geschrieben, Termin stimmt nicht",
  },
  {
    id: "handy",
    typ: "skala",
    text: "Auf dem Handy ist alles gut lesbar und gut auszuwählen.",
    links: "gar nicht",
    rechts: "voll und ganz",
  },
  {
    // Nur Handys: Die App ist eine reine Handy-App (Tobi, 12.08.2026), Tablet
    // und Rechner werden deshalb nicht abgefragt.
    id: "geraet",
    typ: "auswahl",
    text: "Womit hast du getestet?",
    optionen: ["Handy (Android)", "Handy (iPhone)"],
    mehrfach: true,
  },
  {
    id: "fehler",
    typ: "text",
    text: "Ist etwas hängengeblieben, abgestürzt oder nicht gegangen? Wenn ja: was, auf welcher Seite, mit welchem Gerät?",
    platzhalter: "Leer lassen, wenn nichts passiert ist",
  },
  {
    id: "gut_schlecht",
    typ: "text",
    text: "Was hat dir besonders gut gefallen, was weniger, und was fehlt dir?",
    platzhalter: "Ein paar Stichworte genügen",
  },
  {
    id: "gesamt",
    typ: "skala",
    text: "Meine Zufriedenheit mit der App insgesamt",
    links: "gar nicht zufrieden",
    rechts: "sehr zufrieden",
  },
];

/** Die einzige Pflichtfrage. Getrennt gehalten, damit Formular und API dieselbe Quelle nutzen. */
export const PFLICHT_FRAGE_ID = "gesamt";

export const APP_TEST_FRAGEN_BY_ID: Record<string, Frage> = Object.fromEntries(
  APP_TEST_FRAGEN.map((f) => [f.id, f])
);
