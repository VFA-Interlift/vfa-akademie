import { CertificateKind } from "@prisma/client";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { prisma } from "@/lib/prisma";

export type CobraTraining = {
  Caption?: string;
  ID?: number;
  "Schulungs-ID"?: number;
  Schulungscode?: string | null;
  Schulungstitel?: string | null;
  Startdatum?: string | null;
  Enddatum?: string | null;
  Ort?: string | null;
  Dozent?: string | null;
  "Dozent 2"?: string | null;
  "Dozent 3"?: string | null;
  "Dozent 4"?: string | null;
  Beschreibung?: string | null;
};

export type CreditRule = {
  credits: number;
  automatic: boolean;
  reason: string;
  label: string;
};

export type NormalizedTraining = {
  cobraId: string;
  numericCobraId: number;
  title: string;
  code: string;
  date: Date;
  endDate: Date | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  certificateKind: CertificateKind;
  creditRule: CreditRule;
  warnings: string[];
};

export type SyncTrainingsResult = {
  source: "cobra";
  endpoint: string;
  mode: "TRAININGS_SYNC_ONLY";
  received: number;
  normalized: number;
  skipped: number;
  created: number;
  updatedByCobraId: number;
  updatedByCode: number;
  deleted: number;
  orphansKept: number;
  warningsCount: number;
  synced: Array<{
    action:
      | "CREATED"
      | "UPDATED_BY_COBRA_ID"
      | "UPDATED_BY_CODE_AND_LINKED_COBRA_ID";
    id: string;
    cobraId: string | null;
    code: string | null;
    title: string;
  }>;
  deletedItems: Array<{
    id: string;
    cobraId: string | null;
    code: string | null;
    title: string;
  }>;
  keptOrphans: Array<{
    id: string;
    cobraId: string | null;
    code: string | null;
    title: string;
    enrollments: number;
    certificates: number;
    cobraParticipants: number;
  }>;
  warnings: Array<{
    cobraId: string;
    code: string;
    warnings: string[];
    creditRule: CreditRule;
  }>;
  skippedItems: Array<{ reason: string; raw: CobraTraining }>;
  syncedAt: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
}

function cleanNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function getInstructors(training: CobraTraining) {
  return [
    training.Dozent,
    training["Dozent 2"],
    training["Dozent 3"],
    training["Dozent 4"],
  ]
    .map((value) => cleanString(value))
    .filter((value): value is string => Boolean(value));
}

function containsLutz(training: CobraTraining) {
  const haystack = [
    training.Caption,
    training.Schulungscode,
    training.Schulungstitel,
    training.Ort,
    training.Dozent,
    training["Dozent 2"],
    training["Dozent 3"],
    training["Dozent 4"],
    training.Beschreibung,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("lutz");
}

function isInhouseOrManual(code: string, title: string | null) {
  const normalized = `${code} ${String(title ?? "")}`.toUpperCase();

  const manualPrefixes = ["ARB", "DGUV", "FPFW", "SICH", "YLD"];

  return manualPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function deriveCredits(training: CobraTraining): CreditRule {
  const code = normalizeCode(training.Schulungscode);
  const title = cleanString(training.Schulungstitel);
  const isLutz = containsLutz(training);

  if (!code) {
    return {
      credits: 0,
      automatic: false,
      reason: "NO_CODE",
      label: "Kein Schulungscode vorhanden.",
    };
  }

  if (isInhouseOrManual(code, title)) {
    return {
      credits: 0,
      automatic: false,
      reason: "MANUAL_INHOUSE",
      label:
        "Inhouse- oder manuelle Schulung erkannt. Credits bleiben zunächst 0.",
    };
  }

  if (code.startsWith("AZUBI")) {
    return { credits: 20, automatic: true, reason: "AZUBI", label: "Azubi-Schulung." };
  }

  if (code.startsWith("EINST")) {
    return { credits: 100, automatic: true, reason: "EINST", label: "Einsteiger-Schulung." };
  }

  if (code.startsWith("A1")) {
    return {
      credits: isLutz ? 200 : 150,
      automatic: true,
      reason: isLutz ? "A1_LUTZ" : "A1",
      label: isLutz ? "A1 bei Lutz erkannt." : "A1-Schulung.",
    };
  }

  if (code.startsWith("A2")) {
    return {
      credits: isLutz ? 200 : 150,
      automatic: true,
      reason: isLutz ? "A2_LUTZ" : "A2",
      label: isLutz ? "A2 bei Lutz erkannt." : "A2-Schulung.",
    };
  }

  if (code.startsWith("B-") || code === "B") {
    return { credits: 200, automatic: true, reason: "B", label: "B-Kurs." };
  }

  if (code.startsWith("C-") || code === "C") {
    return { credits: 200, automatic: true, reason: "C", label: "C-Kurs." };
  }

  if (code.startsWith("PLG")) {
    return { credits: 150, automatic: true, reason: "PLG", label: "Planung." };
  }

  if (code.startsWith("NUR")) {
    return { credits: 50, automatic: true, reason: "NUR", label: "Normen und Richtlinien." };
  }

  if (code.startsWith("DOK")) {
    return { credits: 100, automatic: true, reason: "DOK", label: "Dokumentation." };
  }

  if (code.startsWith("SCHALL")) {
    return { credits: 150, automatic: true, reason: "SCHALL", label: "Schallschutz." };
  }

  if (code.startsWith("SON")) {
    return { credits: 100, automatic: true, reason: "SON", label: "Sonderanlagen." };
  }

  if (code.startsWith("BETR")) {
    return { credits: 50, automatic: true, reason: "BETR", label: "Neue Anforderungen an den Betrieb." };
  }

  if (code.startsWith("MVO")) {
    return { credits: 100, automatic: true, reason: "MVO", label: "MVO." };
  }

  if (code.startsWith("MOD")) {
    return { credits: 100, automatic: true, reason: "MOD", label: "Modernisierung." };
  }

  if (code.startsWith("BRG")) {
    return { credits: 150, automatic: true, reason: "BRG", label: "Berechnungen." };
  }

  if (code.startsWith("EFK")) {
    return {
      credits: isLutz ? 300 : 250,
      automatic: true,
      reason: isLutz ? "EFK_LUTZ" : "EFK",
      label: isLutz ? "EFK bei Lutz erkannt." : "EFK-Schulung.",
    };
  }

  if (code.startsWith("GEF")) {
    return { credits: 150, automatic: true, reason: "GEF", label: "Gefährdungsbeurteilung." };
  }

  if (code.startsWith("FRQ")) {
    return { credits: 100, automatic: true, reason: "FRQ", label: "Frequenzumrichter." };
  }

  if (code.startsWith("IN/SER/TR")) {
    return {
      credits: 350,
      automatic: true,
      reason: "IN_SER_TR",
      label: "Inbetriebnahme, Servicearbeiten und Troubleshooting.",
    };
  }

  return {
    credits: 0,
    automatic: false,
    reason: "UNKNOWN_CODE",
    label: "Schulungscode wurde keiner automatischen Credit-Regel zugeordnet.",
  };
}

function deriveCertificateKind(code: string): CertificateKind {
  const normalizedCode = normalizeCode(code);

  if (
    normalizedCode.startsWith("A1") ||
    normalizedCode.startsWith("A2") ||
    normalizedCode.startsWith("B-") ||
    normalizedCode === "B" ||
    normalizedCode.startsWith("C-") ||
    normalizedCode === "C"
  ) {
    return CertificateKind.VDI_CERTIFICATE;
  }

  return CertificateKind.ATTENDANCE_CONFIRMATION;
}

function normalizeTraining(training: CobraTraining): NormalizedTraining | null {
  const numericCobraId = cleanNumber(training["Schulungs-ID"] ?? training.ID);
  const code = normalizeCode(training.Schulungscode);

  const title =
    cleanString(training.Schulungstitel) ??
    cleanString(training.Schulungscode) ??
    cleanString(training.Caption);

  const date = parseDate(cleanString(training.Startdatum));
  const endDate = parseDate(cleanString(training.Enddatum));
  const location = cleanString(training.Ort);
  const description = cleanString(training.Beschreibung);

  const instructors = getInstructors(training);
  const instructor = instructors.length > 0 ? instructors.join(" | ") : null;

  const creditRule = deriveCredits(training);

  if (!numericCobraId || !code || !title || !date) {
    return null;
  }

  const warnings: string[] = [];

  if (!creditRule.automatic) {
    warnings.push(creditRule.label);
  }

  if (!location) {
    warnings.push("Ort ist in Cobra leer.");
  }

  if (!instructor) {
    warnings.push("Dozent ist in Cobra leer.");
  }

  return {
    cobraId: String(numericCobraId),
    numericCobraId,
    title,
    code,
    date,
    endDate,
    location,
    instructor,
    description,
    creditsAward: creditRule.credits,
    certificateKind: deriveCertificateKind(code),
    creditRule,
    warnings,
  };
}

async function syncTraining(training: NormalizedTraining) {
  const existingByCobraId = await prisma.training.findUnique({
    where: { cobraId: training.cobraId },
    select: { id: true, code: true },
  });

  if (existingByCobraId) {
    const updated = await prisma.training.update({
      where: { id: existingByCobraId.id },
      data: {
        title: training.title,
        code: training.code,
        date: training.date,
        endDate: training.endDate,
        location: training.location,
        instructor: training.instructor,
        description: training.description,
        certificateKind: training.certificateKind,
        creditsAward: training.creditsAward,
      },
      select: { id: true, code: true, title: true, cobraId: true },
    });

    return { action: "UPDATED_BY_COBRA_ID" as const, training: updated };
  }

  const existingByCode = await prisma.training.findFirst({
    where: { code: training.code },
    select: { id: true, code: true },
  });

  if (existingByCode) {
    const updated = await prisma.training.update({
      where: { id: existingByCode.id },
      data: {
        cobraId: training.cobraId,
        title: training.title,
        code: training.code,
        date: training.date,
        endDate: training.endDate,
        location: training.location,
        instructor: training.instructor,
        description: training.description,
        certificateKind: training.certificateKind,
        creditsAward: training.creditsAward,
      },
      select: { id: true, code: true, title: true, cobraId: true },
    });

    return { action: "UPDATED_BY_CODE_AND_LINKED_COBRA_ID" as const, training: updated };
  }

  const created = await prisma.training.create({
    data: {
      cobraId: training.cobraId,
      title: training.title,
      code: training.code,
      date: training.date,
      endDate: training.endDate,
      location: training.location,
      instructor: training.instructor,
      description: training.description,
      certificateKind: training.certificateKind,
      creditsAward: training.creditsAward,
    },
    select: { id: true, code: true, title: true, cobraId: true },
  });

  return { action: "CREATED" as const, training: created };
}

/**
 * Pulls trainings from the Cobra `app-schulung` endpoint and upserts them into
 * the App-DB. Shared by the daily cron and the admin "sync now" action so the
 * public calendar (which reads the App-DB) matches Cobra/WebConnect.
 */
export async function syncCobraTrainings(): Promise<SyncTrainingsResult> {
  const cobraTrainings = await cobraEndpointGet<CobraTraining[]>("app-schulung");

  const normalized: NormalizedTraining[] = [];
  const skipped: Array<{ reason: string; raw: CobraTraining }> = [];

  for (const cobraTraining of cobraTrainings) {
    const item = normalizeTraining(cobraTraining);

    if (!item) {
      skipped.push({ reason: "MISSING_REQUIRED_FIELDS", raw: cobraTraining });
      continue;
    }

    normalized.push(item);
  }

  let created = 0;
  let updatedByCobraId = 0;
  let updatedByCode = 0;

  const warnings: SyncTrainingsResult["warnings"] = [];
  const synced: SyncTrainingsResult["synced"] = [];

  for (const training of normalized) {
    const result = await syncTraining(training);

    if (result.action === "CREATED") created += 1;
    if (result.action === "UPDATED_BY_COBRA_ID") updatedByCobraId += 1;
    if (result.action === "UPDATED_BY_CODE_AND_LINKED_COBRA_ID") updatedByCode += 1;

    if (training.warnings.length > 0) {
      warnings.push({
        cobraId: training.cobraId,
        code: training.code,
        warnings: training.warnings,
        creditRule: training.creditRule,
      });
    }

    synced.push({
      action: result.action,
      id: result.training.id,
      cobraId: result.training.cobraId,
      code: result.training.code,
      title: result.training.title,
    });
  }

  const { deletedItems, keptOrphans } = await cleanupOrphanTrainings(normalized);

  return {
    source: "cobra",
    endpoint: "app-schulung",
    mode: "TRAININGS_SYNC_ONLY",
    received: cobraTrainings.length,
    normalized: normalized.length,
    skipped: skipped.length,
    created,
    updatedByCobraId,
    updatedByCode,
    deleted: deletedItems.length,
    orphansKept: keptOrphans.length,
    warningsCount: warnings.length,
    synced,
    deletedItems,
    keptOrphans,
    warnings,
    skippedItems: skipped,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Removes "orphan" trainings: rows that were once synced from Cobra (they have a
 * `cobraId`) but no longer appear in the current `app-schulung` pull because they
 * were unpublished/removed in WebConnect. The daily UPSERT-only sync never deletes,
 * which is why the App-DB accumulates stale calendar entries (the 70-vs-50 gap).
 *
 * Safety rules:
 * - Only trainings with a `cobraId` are considered (manually created rows are never touched).
 * - An orphan is only hard-deleted when it has NO enrollments, certificates or Cobra
 *   participants. Deleting a Training cascades to those, so anything carrying user
 *   history is kept and reported instead of destroyed.
 * - If the current pull produced zero normalized trainings (likely an API/auth hiccup),
 *   cleanup is skipped entirely to avoid mass-deleting on a bad response.
 */
async function cleanupOrphanTrainings(normalized: NormalizedTraining[]) {
  const deletedItems: SyncTrainingsResult["deletedItems"] = [];
  const keptOrphans: SyncTrainingsResult["keptOrphans"] = [];

  // Guard: never run cleanup against an empty/failed pull.
  if (normalized.length === 0) {
    return { deletedItems, keptOrphans };
  }

  const seenCobraIds = new Set(normalized.map((t) => t.cobraId));

  const dbTrainings = await prisma.training.findMany({
    where: { cobraId: { not: null } },
    select: {
      id: true,
      cobraId: true,
      code: true,
      title: true,
      _count: {
        select: {
          enrollments: true,
          certificates: true,
          cobraParticipants: true,
        },
      },
    },
  });

  for (const training of dbTrainings) {
    if (training.cobraId && seenCobraIds.has(training.cobraId)) {
      continue;
    }

    const hasHistory =
      training._count.enrollments > 0 ||
      training._count.certificates > 0 ||
      training._count.cobraParticipants > 0;

    if (hasHistory) {
      keptOrphans.push({
        id: training.id,
        cobraId: training.cobraId,
        code: training.code,
        title: training.title,
        enrollments: training._count.enrollments,
        certificates: training._count.certificates,
        cobraParticipants: training._count.cobraParticipants,
      });
      continue;
    }

    await prisma.training.delete({ where: { id: training.id } });

    deletedItems.push({
      id: training.id,
      cobraId: training.cobraId,
      code: training.code,
      title: training.title,
    });
  }

  return { deletedItems, keptOrphans };
}
