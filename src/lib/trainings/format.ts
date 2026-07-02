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

/**
 * Der Cobra-„Gastgeber" kommt als „Firma, Ansprechpartner, Straße, PLZ Ort".
 * Für die Ortsanzeige interessiert nur Firma + Adresse – der Personenname wird
 * entfernt (Segmente, die weder Firma noch Adresse sind und wie ein
 * „Vorname Nachname" aussehen).
 */
export function formatLocationLines(value: string | null) {
  return formatAddressLines(value).filter((segment) => !looksLikePersonName(segment));
}

/**
 * Liefert die Orts-/Gastgeber-Zeilen (Firma + Adresse, ohne Personenname).
 * Cobra füllt das eigentliche „Ort"-Feld nicht – die Anschrift steckt im
 * „Dozent"/Gastgeber-Feld („Firma, Ansprechpartner, Straße, PLZ Ort", bei
 * mehreren mit „ | " getrennt). Deshalb: erst das echte Ortsfeld nehmen, sonst
 * den ersten Gastgeber-Eintrag aus dem Host-Feld.
 */
export function formatVenueLines(
  location: string | null,
  host: string | null
): string[] {
  const primary = formatLocationLines(location);
  if (primary.length) return primary;
  const firstHost = host ? host.split("|")[0] : null;
  return formatLocationLines(firstHost);
}

function looksLikePersonName(segment: string): boolean {
  if (looksLikeCompany(segment) || looksLikeAddress(segment)) return false;
  const words = segment.split(/\s+/).filter(Boolean);
  // Genau 2–3 rein alphabetische Wörter (mit Umlauten/Bindestrich) → Personenname.
  // Einzelne Wörter (z. B. Städtenamen) bleiben erhalten.
  if (words.length < 2 || words.length > 3) return false;
  return words.every((w) => /^[A-Za-zÄÖÜäöüß.\-]+$/.test(w));
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

/**
 * Übergangs-Heuristik bis das Cobra-Feld „inhouse/öffentlich" durchgereicht wird
 * (der `app-schulung`-Endpoint liefert dieses Feld aktuell nicht mit).
 *
 * Erkennung am Schulungscode, der die Daten sauber trennt:
 * - Öffentliche Schulungen haben einen kompakten Einzel-Token-Code OHNE Leerzeichen:
 *   entweder das Standardmuster „KÜRZEL-NNNN(.n)" (z.B. „A1-2701", „NuR-2702.1",
 *   „IN/SER/TR-2701") oder einen generischen/Online-Kurs („EFK-ffT_Auffrischung_online").
 * - Inhouse-Schulungen heißen dagegen „KÜRZEL Kundenname" MIT Leerzeichen
 *   (z.B. „FPFW-Evonik I", „DGUV-Ritschel GmbH", „ARB-Uni Marburg und Innexis").
 *
 * Entscheidend ist also: enthält der Code ein Leerzeichen → Kundenname → Inhouse.
 * Der Code ist verlässlicher als der Titel; nur wenn kein Code da ist, fällt die
 * Prüfung auf den Titel zurück.
 */
// Manuelle/Inhouse-Kürzel (synchron zu sync-trainings#isInhouseOrManual).
const INHOUSE_CODE_PREFIXES = ["ARB", "DGUV", "FPFW", "SICH", "YLD"];

// Bekannte öffentliche Fach-/VDI-Kürzel. Nur mehrbuchstabige, im Titel
// eindeutige Kürzel – die einbuchstabigen „B"/„C" werden ausschließlich über
// den Code (Muster „B-NNNN") erkannt, nicht über den Titel.
const PUBLIC_COURSE_PREFIXES = [
  "A1", "A2", "EFK", "NUR", "NUR", "DOK", "PLG", "SON", "BETR", "MVO", "MOD",
  "BRG", "GEF", "FRQ", "SCHALL", "EINST", "AZUBI", "IN/SER/TR",
];

export function isLikelyInhouse(
  title: string | null | undefined,
  code: string | null | undefined
): boolean {
  const codeSignal = String(code ?? "").trim();

  if (codeSignal) {
    const upper = codeSignal.toUpperCase();
    // Manuelle/Inhouse-Kürzel → Inhouse.
    if (INHOUSE_CODE_PREFIXES.some((p) => upper.startsWith(p))) return true;
    // Standard-Code öffentlicher Schulungen (KÜRZEL-NNNN, evtl. „.n") → öffentlich.
    if (/^[A-Za-zÄÖÜäöüß0-9/]+-\d{3,4}(?:\.\d+)?$/.test(codeSignal)) return false;
    // Bekanntes öffentliches Kürzel → öffentlich.
    if (PUBLIC_COURSE_PREFIXES.some((p) => upper.startsWith(p))) return false;
    // Einzel-Token ohne Leerzeichen (generischer/Online-Kurs) → öffentlich.
    if (!/\s/.test(codeSignal)) return false;
    // „KÜRZEL Kundenname" mit Leerzeichen → Inhouse.
    return true;
  }

  // Kein Code hinterlegt → Rückfall auf den Titel.
  const titleSignal = String(title ?? "").trim();
  if (!titleSignal) return false;
  const upper = titleSignal.toUpperCase();
  if (INHOUSE_CODE_PREFIXES.some((p) => upper.startsWith(p))) return true;
  // Bekanntes öffentliches Kürzel am Titelanfang (z. B. „A1 …") → öffentlich.
  if (PUBLIC_COURSE_PREFIXES.some((p) => upper.startsWith(p))) return false;
  // Sonst: Firmenname mit Leerzeichen → Inhouse.
  return /\s/.test(titleSignal);
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
