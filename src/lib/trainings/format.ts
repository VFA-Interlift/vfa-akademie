export function formatDateRange(startValue: string, endValue: string | null, style: "bis" | "vom" = "bis") {
  const start = formatDate(startValue);
  const end = endValue ? formatDate(endValue) : null;
  if (!start) return "";
  if (!end || end === start) return style === "vom" ? `am ${start}` : start;
  return style === "vom" ? `vom ${start} bis ${end}` : `${start} bis ${end}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatInstructorName(value: string | null) {
  return extractInstructorName(value) || "Noch nicht hinterlegt";
}

export function formatAddressLines(value: string | null) {
  if (!value?.trim()) return [];
  return value.split(",").map((p) => p.trim()).filter(Boolean);
}

function extractInstructorName(value: string | null | undefined) {
  if (!value?.trim()) return "";
  // Multiple instructors stored joined with " | "
  const parts = value.split("|").map((p) => p.trim()).filter(Boolean);
  const names = parts.map(parseSingleInstructor).filter(Boolean);
  return names.join(", ");
}

function stripNameTokens(value: string): string {
  return value
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^(Herr|Frau|Dr\.?|Prof\.?|Dipl\.?-?Ing\.?|Ing\.?|M\.?Sc\.?|B\.?Sc\.?|MBA)$/i.test(p))
    .filter((p) => !/\d/.test(p))
    .join(" ")
    .trim();
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts a clean person name from a single Cobra "Dozent" value. The field
 * typically arrives as "Firma, Name, Adresse, Stadt", but can also be just
 * "Vorname Nachname" or "Nachname, Vorname". We only want the person's name.
 *
 * Strategy: split into comma segments, drop everything that looks like a company
 * (legal form / industry keyword) or an address/city (contains digits), then pick
 * the remaining segment that best resembles a name (prefer "Vorname Nachname").
 * The special "Nachname, Vorname" two-part case is handled explicitly.
 */
function parseSingleInstructor(raw: string): string {
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/\b(E-?Mail|Mail|Telefon|Tel\.?|Mobil|Fax)\b.*$/i, "")
    .trim();

  if (!cleaned) return "";

  const segments = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (segments.length === 0) return "";

  // Single value, e.g. "Vorname Nachname" – return it as-is (if it's a name).
  if (segments.length === 1) {
    if (looksLikeCompany(segments[0]) || looksLikeAddress(segments[0])) return "";
    const words = stripNameTokens(segments[0]).split(/\s+/).filter(Boolean);
    return words.slice(0, 3).join(" ");
  }

  // Keep only segments that are plausibly a person name (no company, no address).
  const candidates = segments
    .filter((segment) => !looksLikeCompany(segment) && !looksLikeAddress(segment))
    .map((segment) => stripNameTokens(segment))
    .filter(Boolean);

  if (candidates.length === 0) return "";

  // "Nachname, Vorname": exactly two short name-like parts → "Vorname Nachname".
  if (
    candidates.length === 2 &&
    wordCount(candidates[0]) === 1 &&
    wordCount(candidates[1]) === 1
  ) {
    return `${candidates[1]} ${candidates[0]}`;
  }

  // Prefer a "Vorname Nachname"-style candidate (2+ words), else the first one.
  const fullName = candidates.find((candidate) => wordCount(candidate) >= 2);
  const chosen = fullName ?? candidates[0];

  return chosen.split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
}

function looksLikeCompany(value: string) {
  const n = value.toLowerCase();
  return [
    "gmbh","mbh","ag","kg","ohg","ug","e.v.","ev","gbr","holding","gruppe","group",
    "company","unternehmen","firma","werke","aufzug","aufzüge","aufzuege","elevator",
    "lift","lifts","hydraulic","hydraulics","hydraulik","metallbau","maschinenbau",
    "service","services","technik","technical","akademie","academy","institut",
    "institute","training","seminar","flughafen","airport",
  ].some((i) => n.includes(i));
}

function looksLikeAddress(value: string) {
  const n = value.toLowerCase();
  return /\d/.test(n) || /\b(strasse|straße|str\.|weg|platz|allee|ring|d\s?\d{4,5}|\d{4,5})\b/i.test(n);
}

export function cleanTrainingTitle(value: string) {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Übergangs-Heuristik bis das Cobra-Feld „inhouse/öffentlich" durchgereicht wird:
 * Öffentliche Schulungen heißen „Kürzel + Datum" (z.B. „A2-2704"), evtl. mit
 * generischer Beschreibung in Klammern. Inhouse-Schulungen haben zusätzlich den
 * Firmennamen im Titel (z.B. „A2-2704 Flughafen Stuttgart", „… Ritsche GmbH").
 * Solche werden aus dem öffentlichen Kalender ausgeblendet.
 */
export function isLikelyInhouse(
  title: string | null | undefined,
  code: string | null | undefined
): boolean {
  const raw = String(title ?? "").trim();
  if (!raw) return false;

  // Eindeutige Firmen-Rechtsformen (kommen in echten Schulungstiteln nie vor) → Inhouse
  if (/\b(?:gmbh|mbh|ag|kg|ohg|ug|gbr|e\.?\s?v\.?|e\.?\s?k\.?)\b/i.test(raw)) {
    return true;
  }

  // Generische Beschreibung in Klammern entfernen (kein Firmenname)
  let rest = raw.replace(/\([^)]*\)/g, " ");

  // Bekannten Schulungscode entfernen (z.B. „A2-2704")
  const codeStr = String(code ?? "").trim();
  if (codeStr) {
    rest = rest.replace(new RegExp(escapeRegExp(codeStr), "ig"), " ");
  }

  // Generisches Code-/Datums-Muster + reine Zahlen entfernen
  rest = rest
    .replace(/\b[A-Za-zÄÖÜäöüß/]{1,12}-\d{2,4}(?:\.\d+)?\b/g, " ") // A2-2704, NuR-2603.1
    .replace(/\b\d{2,4}\b/g, " ")
    .replace(/[.\-–—:,/|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Bleibt ein echtes Wort übrig → vermutlich Firmenname → Inhouse
  return /[A-Za-zÄÖÜäöüß]{3,}/.test(rest);
}

export function getDisplayTrainingTitle(training: { code?: string | null; title: string }) {
  if (training.code?.trim()) return training.code.trim();
  return cleanTrainingTitle(training.title);
}

export function formatEnrollmentStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: "Ausstehend",
    CONFIRMED: "Bestätigt",
    ATTENDED: "Teilgenommen",
    NO_SHOW: "Nicht erschienen",
    CANCELLED: "Storniert",
    COMPLETED: "Abgeschlossen",
    CERTIFICATE_ISSUED: "Zertifikat ausgestellt",
  };
  return map[status] ?? status;
}

export function enrollmentStatusColor(status: string): { bg: string; color: string; border: string } {
  if (status === "CONFIRMED") return { bg: "rgba(0,120,115,0.08)", color: "#007873", border: "1px solid rgba(0,120,115,0.25)" };
  if (status === "ATTENDED" || status === "COMPLETED" || status === "CERTIFICATE_ISSUED")
    return { bg: "rgba(0,120,115,0.12)", color: "#005f5b", border: "1px solid rgba(0,120,115,0.35)" };
  if (status === "CANCELLED" || status === "NO_SHOW")
    return { bg: "rgba(176,0,32,0.08)", color: "#B00020", border: "1px solid rgba(176,0,32,0.25)" };
  return { bg: "rgba(255,193,0,0.10)", color: "#7C5A0A", border: "1px solid rgba(255,193,0,0.35)" };
}
