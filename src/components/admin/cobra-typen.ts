import { formatInstructorName } from "@/lib/trainings/format";

/**
 * Typen und reine Helfer der Cobra-Adminseite — ausgelagert aus
 * CobraAdminClient.tsx (Launch-Runde 05.09.2026), damit die Seite unter
 * 500 Zeilen bleibt.
 */

export type CobraTraining = {
  cobraId: number | null;
  caption: string | null;
  code: string | null;
  title: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  instructors: string[];
  description: string | null;
  raw?: Record<string, unknown> | null;
};

export type TrainingsResponse =
  | {
      ok: true;
      source: "cobra";
      endpoint: string;
      count: number;
      trainings: CobraTraining[];
    }
  | {
      ok: false;
      error: string;
      message?: string;
      details?: unknown;
    };

export type PreviewResponse =
  | {
      ok: true;
      mode: "PREVIEW_ONLY";
      action: "CREATE_NEW" | "UPDATE_EXISTING_BY_CODE";
      cobra: {
        cobraId: number;
        code: string;
        title: string;
        date: string;
        endDate: string | null;
        location: string | null;
        instructor: string | null;
        description: string | null;
      };
      app: {
        exists: boolean;
        existingTraining: {
          id: string;
          title: string;
          code: string | null;
          date: string;
          endDate: string | null;
          location: string | null;
          instructor: string | null;
          description: string | null;
          creditsAward: number;
          certificateKind: string;
        } | null;
      };
      proposed: {
        title: string;
        code: string;
        date: string;
        endDate: string | null;
        location: string | null;
        instructor: string | null;
        description: string | null;
        creditsAward: number;
        creditRule: {
          credits: number;
          automatic: boolean;
          reason: string;
          label: string;
        };
      };
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      message?: string;
      details?: unknown;
    };

export type PreviewState = {
  loading: boolean;
  error: string;
  data: PreviewResponse | null;
};

export function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCoursePrefix(code: string | null) {
  const cleanCode = String(code ?? "").trim();

  if (!cleanCode) {
    return "SONSTIGE";
  }

  const match = cleanCode.match(/^[A-Za-zÄÖÜäöüß0-9/]+/);

  return match?.[0]?.toUpperCase() ?? cleanCode.toUpperCase();
}

export function searchText(training: CobraTraining) {
  return [
    training.cobraId,
    training.caption,
    training.code,
    training.title,
    training.date,
    training.endDate,
    training.location,
    training.instructor,
    training.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getTrainingTimestamp(training: CobraTraining) {
  if (!training.date) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(training.date).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

/**
 * Eine Schulung gilt als vergangen, sobald ihr Ende (oder ihr Beginn, wenn es
 * kein Ende gibt) vor dem heutigen Tagesanfang liegt. Vergangene wandern
 * automatisch ins zugeklappte Archiv.
 */
export function isPastTraining(training: CobraTraining, cutoff: number) {
  const reference = training.endDate ?? training.date;

  if (!reference) {
    return false;
  }

  const timestamp = new Date(reference).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < cutoff;
}

export function getPreviewKey(cobraId: number | null) {
  return String(cobraId ?? "unknown");
}

/**
 * Nur den sauberen Dozentennamen zeigen. Jeder Cobra-Wert „Dozent“ wird auf
 * den Personennamen reduziert; ergibt das nichts, bleibt der Rohwert stehen,
 * damit der Admin unerwartete Daten noch erkennt („—“ wenn wirklich leer).
 */
export function formatInstructorNames(
  values: string[] | null | undefined,
  fallback: string | null | undefined
) {
  const list =
    values && values.length > 0
      ? values
      : fallback
        ? fallback.split("|")
        : [];

  const cleaned = list
    .map((value) => formatInstructorName(value))
    .filter((name) => name && name !== "Noch nicht hinterlegt");

  if (cleaned.length > 0) {
    return cleaned.join(", ");
  }

  const raw = list
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return raw.length > 0 ? raw.join(" · ") : "—";
}

export function cleanTrainingTitle(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatRawValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
