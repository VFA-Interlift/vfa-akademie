/**
 * Statischer Fragenkatalog der Feedback-Bögen (nicht in der DB).
 *
 * Zwei offizielle Vorlagen:
 *  - PUBLIC  = „Feedbackbogen öffentliche Schulung" (inkl. Block „Rahmen vor Ort")
 *  - INHOUSE = „Feedback Inhouse" (ohne „Rahmen vor Ort", dafür mit
 *              „Schulungsmaterial ist qualitativ hochwertig")
 *
 * Beide teilen sich den Großteil der Fragen. Die konkrete Abschnittsliste wird
 * je nach Form-Typ und Anzahl der Dozent(inn)en über `getFeedbackForm()` gebaut.
 */

export type FeedbackFormType = "PUBLIC" | "INHOUSE";

export type FeedbackQuestionType = "rating" | "text" | "single" | "multi";

export type FeedbackQuestion = {
  key: string;
  label: string;
  type: FeedbackQuestionType;
  /** Antwortoptionen für `single`/`multi`. */
  options?: string[];
  /** Pflichtfeld (nur Gesamtzufriedenheit). */
  required?: boolean;
};

export type FeedbackSection = {
  title: string;
  questions: FeedbackQuestion[];
};

/** Schlüssel der Gesamtbewertung – wird denormalisiert als `overallRating` gespeichert. */
export const OVERALL_RATING_KEY = "allgemeineZufriedenheit";

/** Credits, die pro abgegebenem Feedback gutgeschrieben werden. */
export const FEEDBACK_CREDITS = 10;

const SKRIPTFORM_OPTIONS = [
  "Ausschließlich digitales Skript (PDF)",
  "Digitales + ausgedrucktes Skript",
];

/** Kursliste aus Frage „Ich interessiere mich für folgende Schulungsangebote" (identisch in beiden Vorlagen). */
export const SCHULUNGSANGEBOTE = [
  "Weiterbildung Aufzugstechnik - Grundkurs A1 (Quereinstieger, Montage, Wartung, Vertrieb)",
  "Weiterbildung Aufzugstechnik - Vertiefungskurs A2 (Aufsichtsführende, Montage-/Serviceleiter)",
  "Weiterbildung Aufzugstechnik - Aufbaukurs B (Meister, Projektverantwortliche, Funktionsprüfung)",
  "Weiterbildung Aufzugstechnik - Aufbaukurs C (Planer, Ingenieure)",
  "Aufzüge nach Maschinenrichtlinie/Maschinenverordnung",
  "Sonderanlagen: Feuerwehr-, Lasten- und Glasaufzüge",
  "Aufzugsplanung als Teil der Gebäudeplanung",
  "Berechnungen im Aufzugbau",
  "Dokumentation im Aufzugbau",
  "Modernisierung im Aufzugbau",
  "Schallschutz an Aufzugsanlagen",
  "Elektrofachkraft für festgelegte Tätigkeiten im Aufzugbau - Qualifizierung",
  "Elektrofachkraft für festgelegte Tätigkeiten im Aufzugbau - Auffrischung 1 Praxistag",
  "Gefährdungsbeurteilung",
  "Grundlegende Sicherheitsanforderungen für Arbeiten an Aufzügen (Jährliche Unterweisung)",
  'Qualifizierung zur Beauftragten Person gem. BetrSichV (ehem. "Aufzugswärter")',
  "Qualifizierung von Beschäftigten aufzugsfremder Unternehmen nach DGUV 309-011",
  "Inbetriebnahme von Aufzugsanlagen - kompakte Praxisschulung, 3 Tage",
  "Servicearbeiten an Aufzugsanlagen - kompakte Praxisschulung, 2 Tage",
  "Troubleshooting an einer Aufzugsanlage - kompakte Praxisschulung, 2 Tage",
  "Normen und Richtlinien: Aktuelles aus dem Regelwerk, Schwerpunkt EN ISO 8100-1/2",
  "Normen und Richtlinien: Grundlagen zum aktuellen Regelwerk",
];

const r = (key: string, label: string): FeedbackQuestion => ({ key, label, type: "rating" });
const t = (key: string, label: string): FeedbackQuestion => ({ key, label, type: "text" });

/**
 * Baut die Abschnittsliste für die übergebene Form.
 * @param formType        PUBLIC | INHOUSE
 * @param instructorNames Bereinigte Dozentennamen (max. 2 werden verwendet).
 */
export function getFeedbackForm(
  formType: FeedbackFormType,
  instructorNames: string[] = []
): FeedbackSection[] {
  const isInhouse = formType === "INHOUSE";
  const dozent1 = instructorNames[0]?.trim() || "der Dozent/die Dozentin";
  const dozent2 = instructorNames[1]?.trim();

  const sections: FeedbackSection[] = [];

  sections.push({
    title: "Gesamtbewertung der Schulung",
    questions: [
      { key: OVERALL_RATING_KEY, label: "Ihre allgemeine Zufriedenheit mit der Schulung", type: "rating", required: true },
      r("weiterempfehlung", "Wie wahrscheinlich ist es, dass Sie diese Schulung an Kollegen oder Freunde weiterempfehlen?"),
      r("zufriedenheitErgebnisse", "Zufriedenheit mit den Ergebnissen der Schulung"),
      r("lernerfolg", "Lernerfolg für Sie persönlich"),
      r("anwendbarkeitPraxis", "Anwendbarkeit in der Praxis"),
    ],
  });

  sections.push({
    title: "Arbeit in der Schulung",
    questions: [
      r("arbeitsklima", "Das Arbeitsklima ist angenehm."),
      r("umgangston", "Der Umgangston ist freundlich und respektvoll."),
      r("anzahlTeilnehmende", "Die Anzahl der Teilnehmenden ist passend."),
    ],
  });

  sections.push({
    title: "Schulungsinhalte",
    questions: [
      r("inhalteRelevant", "Die Inhalte sind relevant und nützlich."),
      r("inhalteInteressant", "Die Inhalte sind interessant und abwechslungsreich aufbereitet."),
      r("bezugPraxis", "Der Bezug zur Praxis wird hergestellt."),
    ],
  });

  sections.push({
    title: "Schulungsstruktur",
    questions: [
      r("zieleKlar", "Ziele und Inhalte sind klar definiert."),
      r("ablaufStrukturiert", "Der Ablauf ist strukturiert und wird eingehalten."),
      r("tempo", "Tempo und Zeitmanagement sind angemessen."),
      r("laenge", "Die Länge der Schulung war ausreichend."),
    ],
  });

  sections.push({
    title: "Schulungsmaterialien",
    questions: [
      r("skriptBegleitung", "Das ausgedruckte Skript eignet sich gut zur Begleitung der Schulung."),
      {
        key: "skriptform",
        label: "Welche Skriptformen zur Begleitung und Nachbereitung der Schulung wünschen Sie sich?",
        type: "single",
        options: SKRIPTFORM_OPTIONS,
      },
      t("skriptVerbesserung", "Verbesserungsvorschläge für das Skript:"),
    ],
  });

  sections.push({
    title: "Wissenstransfer",
    questions: [
      ...(isInhouse ? [r("schulungsmaterialHochwertig", "Das Schulungsmaterial ist qualitativ hochwertig.")] : []),
      r("interaktion", "Die Interaktion zwischen Dozierenden und Teilnehmenden ist gut."),
      r("fragenBehandelt", "Fragen werden angemessen behandelt."),
    ],
  });

  sections.push({
    title: dozent2 ? `Dozent: ${dozent1}` : "Dozent",
    questions: [
      r("dozent1Fachwissen", `Das Fachwissen von ${dozent1} ist überzeugend.`),
      r("dozent1Verstaendlich", `${dozent1} erklärt verständlich.`),
    ],
  });

  if (dozent2) {
    sections.push({
      title: `Dozent: ${dozent2}`,
      questions: [
        r("dozent2Fachwissen", `Das Fachwissen von ${dozent2} ist überzeugend.`),
        r("dozent2Verstaendlich", `${dozent2} erklärt verständlich.`),
      ],
    });
  }

  if (!isInhouse) {
    sections.push({
      title: "Rahmen vor Ort",
      questions: [
        r("empfangen", "Ich wurde herzlich empfangen."),
        r("schulungsort", "Der Schulungsort ist angemessen."),
        r("raeumlichkeiten", "Die Räumlichkeiten sind gut ausgestattet."),
        r("verpflegung", "Die Verpflegung ist ausreichend und lecker."),
        r("betriebsfuehrung", "Die Betriebsführung war interessant."),
        r("gemeinsamerAbend", "Der gemeinsame Abend war gut ausgerichtet."),
      ],
    });
  }

  sections.push({
    title: "Ihre Anmerkungen",
    questions: [
      t("besondersGut", "Besonders gut gefallen hat mir"),
      t("wenigerGut", "Weniger gut gefallen hat mir"),
      t("themenwuensche", "Welche Schulungsthemen wünschen Sie sich für die Zukunft?"),
    ],
  });

  sections.push({
    title: "Interesse an weiteren Angeboten",
    questions: [
      {
        key: "interesseAngebote",
        label: "Ich interessiere mich für folgende Schulungsangebote:",
        type: "multi",
        options: SCHULUNGSANGEBOTE,
      },
    ],
  });

  return sections;
}

/** Flache Liste aller Fragen einer Abschnittsliste. */
export function flattenQuestions(sections: FeedbackSection[]): FeedbackQuestion[] {
  return sections.flatMap((section) => section.questions);
}
