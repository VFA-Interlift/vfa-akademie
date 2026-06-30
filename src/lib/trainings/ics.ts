import { cleanTrainingTitle, formatInstructorName } from "@/lib/trainings/format";

export type IcsTraining = {
  id: string;
  title: string;
  code: string | null;
  date: Date;
  endDate: Date | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
};

// Escaping gemäß RFC 5545 für Textwerte (SUMMARY/LOCATION/DESCRIPTION).
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// YYYYMMDD aus den UTC-Anteilen eines Datums. Schulungen sind in der App reine
// Ganztags-Termine (die UI zeigt nie eine Uhrzeit), daher genügt der Kalendertag
// und wir umgehen jegliche Zeitzonen-Verschiebung.
function toIcsDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// UTC-Zeitstempel YYYYMMDDTHHMMSSZ für DTSTAMP.
function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Zeilen auf 75 Oktette falten (RFC 5545). Fortsetzung beginnt mit einem Space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(" " + rest);
  return parts.join("\r\n");
}

export function buildTrainingIcs(training: IcsTraining): string {
  const summary = cleanTrainingTitle(training.title) || training.code?.trim() || "Schulung";

  const start = training.date;
  // All-Day DTEND ist exklusiv → letzter Tag + 1. Ohne endDate ist der Termin
  // eintägig (DTEND = Starttag + 1).
  const lastDay = training.endDate ?? training.date;
  const end = addDays(lastDay, 1);

  const descriptionParts: string[] = ["Schulung der VFA-Akademie"];
  const instructor = formatInstructorName(training.instructor);
  if (instructor && instructor !== "Noch nicht hinterlegt") {
    descriptionParts.push(`Dozent: ${instructor}`);
  }
  if (training.code?.trim()) descriptionParts.push(`Kurs: ${training.code.trim()}`);
  if (training.creditsAward > 0) descriptionParts.push(`Credits: ${training.creditsAward}`);
  const description = descriptionParts.join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VFA-Akademie//Schulungskalender//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${training.id}@vfa-akademie.de`,
    `DTSTAMP:${toIcsTimestamp(new Date())}`,
    `DTSTART;VALUE=DATE:${toIcsDate(start)}`,
    `DTEND;VALUE=DATE:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
  ];

  if (training.location?.trim()) {
    lines.push(`LOCATION:${escapeText(training.location.trim())}`);
  }

  lines.push(`DESCRIPTION:${escapeText(description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

// Dateinamensicherer Basisname für den Download.
export function icsFileName(training: IcsTraining): string {
  const base = (training.code?.trim() || cleanTrainingTitle(training.title) || "schulung")
    .replace(/[^A-Za-z0-9ÄÖÜäöüß._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `${base || "schulung"}.ics`;
}
