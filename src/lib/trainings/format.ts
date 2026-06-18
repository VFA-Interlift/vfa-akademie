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
  return date.toLocaleDateString("de-DE");
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

function parseSingleInstructor(raw: string): string {
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/\b(E-Mail|Email|Mail|Telefon|Tel\.?|Mobil)\b.*$/i, "")
    .trim();

  const commaParts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);

  // Cobra CRM format: "Nachname, Vorname[, Adresse...]" → return "Vorname Nachname"
  if (commaParts.length >= 2) {
    const lastName = commaParts[0];
    const firstName = commaParts[1].split(/\s+/)[0].trim();
    if (
      firstName &&
      lastName &&
      !looksLikeAddress(firstName) &&
      !looksLikeCompany(lastName) &&
      !looksLikeCompany(`${firstName} ${lastName}`) &&
      !looksLikeAddress(`${firstName} ${lastName}`)
    ) {
      return `${firstName} ${lastName}`;
    }
  }

  // Direct format: "Vorname Nachname"
  const likelyName = cleaned
    .split(/[;|/]/)[0]
    .replace(/\b(Adresse|Strasse|Straße|Str\.?|PLZ|Ort|Firma|Unternehmen)\b.*$/i, "")
    .trim();

  if (!likelyName || looksLikeCompany(likelyName) || looksLikeAddress(likelyName)) return "";

  const words = likelyName
    .split(" ").map((p) => p.trim()).filter(Boolean)
    .filter((p) => !/^(Herr|Frau|Dr\.?|Prof\.?|Dipl\.?-?Ing\.?)$/i.test(p))
    .filter((p) => !/\d/.test(p));

  if (words.length < 2) return "";
  const name = `${words[0]} ${words[1]}`;
  if (looksLikeCompany(name) || looksLikeAddress(name)) return "";
  return name;
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
