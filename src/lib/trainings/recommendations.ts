import { prisma } from "@/lib/prisma";
import { isLikelyInhouse } from "@/lib/trainings/format";

/**
 * Kurskatalog nach Code-Kürzel (Quelle: Programm-PDFs 2027, u. a.
 * „Weiterbildung im Aufzugbau VDI"). Titel + Kurzbeschreibung für die
 * Empfehlungs-Karten unter „Meine Schulungen".
 */
export const COURSE_CATALOG: Record<string, { title: string; description: string }> = {
  A1: {
    title: "Grundkurs A1 – Weiterbildung im Aufzugbau (VDI)",
    description:
      "Grundausbildung der VDI-Kursreihe: Sicherheit, Mechanik, Aufzugsysteme Seil/Hydraulik und Elektrotechnik. Für Quereinsteiger in Montage, Wartung und Vertrieb.",
  },
  A2: {
    title: "Vertiefungskurs A2 – Weiterbildung im Aufzugbau (VDI)",
    description:
      "Vertiefung der VDI-Kursreihe mit Prüfung und VDI-Zertifikat Kategorie A (VDI 2168). Für Monteure, Aufsichtsführende sowie Montage- und Serviceleiter.",
  },
  B: {
    title: "Aufbaukurs B – Weiterbildung im Aufzugbau (VDI)",
    description:
      "Aufbaukurs mit Prüfung und VDI-Zertifikat Kategorie B (VDI 2168). Für Verantwortliche der Funktionsprüfung, Meister und Projektverantwortliche.",
  },
  C: {
    title: "Aufbaukurs C – Weiterbildung im Aufzugbau (VDI)",
    description:
      "Abschluss der VDI-Kursreihe mit Prüfung und VDI-Zertifikat Kategorie C (VDI 2168). Für Planer, Ingenieure oder gleichwertig Qualifizierte.",
  },
  EINST: {
    title: "Aufzüge für Einsteiger",
    description: "Kompakter Einstieg in die Aufzugstechnik – ideale Basis vor dem VDI-Grundkurs A1.",
  },
  AZUBI: {
    title: "Aufzüge für Einsteiger – Welcome Azubis",
    description: "Einsteiger-Schulung speziell für Auszubildende.",
  },
  EFK2: {
    title: "Elektrofachkraft ffT im Aufzugbau – Teil 2",
    description: "Zweiter Teil der EFK-Ausbildung für festgelegte Tätigkeiten im Aufzugbau.",
  },
  PLG: {
    title: "Aufzugsplanung als Teil der Gebäudeplanung",
    description: "Schwerpunktschulung für Planer: Aufzugsplanung im Gebäudekontext.",
  },
  NUR: {
    title: "Aktuelles aus dem Regelwerk",
    description: "Neuerungen aus der EN ISO 8100-1/2 und dem aktuellen Regelwerk.",
  },
  DOK: {
    title: "Dokumentation im Aufzugbau",
    description: "Schwerpunktschulung zur normgerechten Dokumentation.",
  },
  SCHALL: {
    title: "Schallschutz",
    description: "Schwerpunktschulung Schallschutz im Aufzugbau.",
  },
  SON: {
    title: "Sonderanlagen",
    description: "Schwerpunktschulung zu Sonderanlagen.",
  },
  BETR: {
    title: "Betrieb von Aufzugsanlagen",
    description: "Neue Anforderungen an den Betrieb von Aufzugsanlagen.",
  },
  MVO: {
    title: "Maschinenverordnung",
    description: "Schwerpunktschulung zur neuen Maschinenverordnung.",
  },
  MOD: {
    title: "Modernisierung",
    description: "Schwerpunktschulung zur Modernisierung von Aufzugsanlagen.",
  },
  BRG: {
    title: "Berechnungen im Aufzugbau",
    description: "Schwerpunktschulung zu Berechnungen im Aufzugbau.",
  },
  GEF: {
    title: "Gefährdungsbeurteilung",
    description: "Schwerpunktschulung zur Gefährdungsbeurteilung.",
  },
  FRQ: {
    title: "Frequenzumrichter",
    description: "Schwerpunktschulung zu Frequenzumrichtern in der Aufzugstechnik.",
  },
  "IN/SER/TR": {
    title: "Inbetriebnahme, Service, Troubleshooting",
    description: "Praxisschulung zu Inbetriebnahme, Servicearbeiten und Troubleshooting.",
  },
};

/**
 * VDI-Weiterbildungsleiter: Einsteiger/Azubi → A1 → A2 → B → C.
 * Empfohlen wird immer nur die nächste Stufe nach dem höchsten
 * gebuchten/abgeschlossenen Kurs.
 */
const VDI_STAGES: Record<string, number> = {
  EINST: 0,
  AZUBI: 0,
  A1: 1,
  A2: 2,
  B: 3,
  C: 4,
};

const VDI_LADDER = ["A1", "A2", "B", "C"]; // Stufe 1–4

export type TrainingRecommendation = {
  prefix: string;
  title: string;
  description: string;
  reason: string;
  /** Nächster buchbarer Termin (falls in der App-DB vorhanden). */
  nextTraining: {
    id: string;
    code: string | null;
    date: string;
    endDate: string | null;
    instructor: string | null;
    location: string | null;
  } | null;
};

/** Kürzel aus einem Schulungs-/Zertifikatscode („A1-2701" → „A1"). */
export function coursePrefixOf(code: string | null | undefined): string | null {
  const cleaned = String(code ?? "").trim().toUpperCase();
  if (!cleaned) return null;
  return cleaned.split("-")[0].trim() || null;
}

/**
 * Empfehlungen für „Meine Schulungen" — strikte Kette:
 *  - Noch gar keine Schulung gebucht/abgeschlossen → nur A1 und Azubi-Kurs.
 *  - Sonst genau die nächste Stufe der VDI-Reihe (A1 → A2 → B → C) nach dem
 *    höchsten gebuchten/abgeschlossenen Kurs.
 *  - Zusatz: EFK Teil 1 vorhanden, Teil 2 fehlt → EFK2 empfehlen.
 * Bereits gebuchte/abgeschlossene Kurse werden nie empfohlen.
 */
export async function getTrainingRecommendations(
  userEmail: string,
  maxItems = 3
): Promise<TrainingRecommendation[]> {
  const email = userEmail.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      certificates: {
        where: { status: "ISSUED" },
        select: { code: true, training: { select: { code: true } } },
      },
      enrollments: {
        where: { status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        select: { training: { select: { code: true } } },
      },
    },
  });

  if (!user) return [];

  // Alles, was der Nutzer schon hat (Zertifikat) oder gebucht hat (Enrollment).
  const done = new Set<string>();
  for (const cert of user.certificates) {
    const p = coursePrefixOf(cert.code) ?? coursePrefixOf(cert.training?.code);
    if (p) done.add(p);
  }
  const doneOrBooked = new Set(done);
  for (const enrollment of user.enrollments) {
    const p = coursePrefixOf(enrollment.training.code);
    if (p) doneOrBooked.add(p);
  }

  // Bevorstehende öffentliche Termine je Kürzel (frühester zuerst).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = await prisma.training.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      code: true,
      date: true,
      endDate: true,
      instructor: true,
      location: true,
    },
  });

  const nextByPrefix = new Map<string, (typeof upcoming)[number]>();
  for (const training of upcoming) {
    if (isLikelyInhouse(training.title, training.code)) continue;
    const p = coursePrefixOf(training.code);
    if (p && !nextByPrefix.has(p)) nextByPrefix.set(p, training);
  }

  const recommendations: TrainingRecommendation[] = [];
  const recommended = new Set<string>();

  const push = (prefix: string, reason: string) => {
    if (recommended.has(prefix) || doneOrBooked.has(prefix)) return;
    const catalog = COURSE_CATALOG[prefix];
    if (!catalog) return;
    const next = nextByPrefix.get(prefix) ?? null;
    recommendations.push({
      prefix,
      title: catalog.title,
      description: catalog.description,
      reason,
      nextTraining: next
        ? {
            id: next.id,
            code: next.code,
            date: next.date.toISOString(),
            endDate: next.endDate ? next.endDate.toISOString() : null,
            instructor: next.instructor,
            location: next.location,
          }
        : null,
    });
    recommended.add(prefix);
  };

  // Noch gar nichts gebucht oder abgeschlossen → Einstieg empfehlen.
  if (doneOrBooked.size === 0) {
    push("A1", "Dein Einstieg in die VDI-Kursreihe");
    push("AZUBI", "Der Einsteigerkurs für Auszubildende");
    return recommendations.slice(0, maxItems);
  }

  // Höchste erreichte Stufe der VDI-Leiter (gebucht zählt wie abgeschlossen).
  let maxStage = -1;
  for (const prefix of doneOrBooked) {
    const stage = VDI_STAGES[prefix];
    if (stage !== undefined && stage > maxStage) maxStage = stage;
  }

  if (maxStage === -1) {
    // Bisher nur Schwerpunkt-/Sonderkurse → Einstieg in die VDI-Reihe.
    push("A1", "Dein Einstieg in die VDI-Kursreihe");
  } else if (maxStage < 4) {
    const next = VDI_LADDER[maxStage]; // Stufe maxStage+1 (Array ist 1-basiert versetzt)
    const highest = [...doneOrBooked]
      .filter((p) => VDI_STAGES[p] === maxStage)
      .map((p) => COURSE_CATALOG[p]?.title ?? p)[0];
    push(next, `Dein nächster Schritt nach „${shortTitle(highest ?? "deiner letzten Schulung")}"`);
  }
  // maxStage === 4 (C erreicht): VDI-Reihe komplett – keine Empfehlung.

  // EFK-Reihe: Teil 1 vorhanden, Teil 2 fehlt.
  if (doneOrBooked.has("EFK1") && !doneOrBooked.has("EFK2")) {
    push("EFK2", "Vervollständige deine EFK-Ausbildung");
  }

  return recommendations.slice(0, maxItems);
}

function shortTitle(title: string): string {
  return title.split("–")[0].trim();
}
