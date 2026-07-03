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

/** Weiterführungs-Kette: abgeschlossenes Kürzel → nächster empfohlener Kurs. */
const NEXT_STEP: Record<string, string> = {
  EINST: "A1",
  AZUBI: "A1",
  A1: "A2",
  A2: "B",
  B: "C",
  EFK1: "EFK2",
};

/** Schwerpunkt-Kürzel, die generell empfohlen werden dürfen (kein VDI-Kern). */
const FOCUS_PREFIXES = [
  "NUR", "DOK", "SCHALL", "SON", "BETR", "MVO", "MOD", "BRG", "GEF", "FRQ", "PLG", "IN/SER/TR",
];

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
 * Empfehlungen für „Meine Schulungen": zuerst der nächste Schritt der
 * VDI-Reihe (A1 → A2 → B → C), danach Schwerpunktschulungen, die der Nutzer
 * noch nicht besucht hat. Bereits gebuchte/abgeschlossene Kurse werden nicht
 * empfohlen; angezeigt wird je Kürzel der nächste bevorstehende öffentliche
 * Termin aus der App-DB.
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

  // 1) Nächster Schritt der Kursreihe(n), basierend auf Abschlüssen.
  for (const prefix of done) {
    const next = NEXT_STEP[prefix];
    if (next) {
      const sourceTitle = COURSE_CATALOG[prefix]?.title ?? prefix;
      push(next, `Dein nächster Schritt nach „${shortTitle(sourceTitle)}"`);
    }
    if (recommendations.length >= maxItems) return recommendations.slice(0, maxItems);
  }

  // 2) Schwerpunktschulungen, die noch fehlen (nur mit buchbarem Termin).
  for (const prefix of FOCUS_PREFIXES) {
    if (recommendations.length >= maxItems) break;
    if (!nextByPrefix.has(prefix)) continue;
    push(prefix, "Schwerpunktschulung passend zu deinem Profil");
  }

  return recommendations.slice(0, maxItems);
}

function shortTitle(title: string): string {
  return title.split("–")[0].trim();
}
