import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type IncomingCobraTraining = {
  cobraId?: number | null;
  caption?: string | null;
  code?: string | null;
  title?: string | null;
  date?: string | null;
  endDate?: string | null;
  location?: string | null;
  instructor?: string | null;
  instructors?: string[];
  description?: string | null;
};

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error,
      details,
    },
    { status }
  );
}

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

function normalizeCode(value: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function containsLutz(training: IncomingCobraTraining) {
  const haystack = [
    training.caption,
    training.code,
    training.title,
    training.location,
    training.instructor,
    ...(Array.isArray(training.instructors) ? training.instructors : []),
    training.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("lutz");
}

function isInhouseOrManual(code: string, title: string | null) {
  const normalized = `${code} ${String(title ?? "")}`.toUpperCase();

  const manualPrefixes = [
    "ARB",
    "DGUV",
    "FPFW",
    "SICH",
    "YLD",
  ];

  return manualPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function deriveCredits(training: IncomingCobraTraining) {
  const code = normalizeCode(training.code);
  const title = cleanString(training.title);
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
        "Inhouse- oder manuelle Schulung erkannt. Credits sollten manuell geprüft werden.",
    };
  }

  if (code.startsWith("AZUBI")) {
    return {
      credits: 20,
      automatic: true,
      reason: "AZUBI",
      label: "Azubi-Schulung.",
    };
  }

  if (code.startsWith("EINST")) {
    return {
      credits: 100,
      automatic: true,
      reason: "EINST",
      label: "Einsteiger-Schulung.",
    };
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
    return {
      credits: 200,
      automatic: true,
      reason: "B",
      label: "B-Kurs.",
    };
  }

  if (code.startsWith("C-") || code === "C") {
    return {
      credits: 200,
      automatic: true,
      reason: "C",
      label: "C-Kurs.",
    };
  }

  if (code.startsWith("PLG")) {
    return {
      credits: 150,
      automatic: true,
      reason: "PLG",
      label: "Planung.",
    };
  }

  if (code.startsWith("NUR")) {
    return {
      credits: 50,
      automatic: true,
      reason: "NUR",
      label: "Normen und Richtlinien.",
    };
  }

  if (code.startsWith("DOK")) {
    return {
      credits: 100,
      automatic: true,
      reason: "DOK",
      label: "Dokumentation.",
    };
  }

  if (code.startsWith("SCHALL")) {
    return {
      credits: 150,
      automatic: true,
      reason: "SCHALL",
      label: "Schallschutz.",
    };
  }

  if (code.startsWith("SON")) {
    return {
      credits: 100,
      automatic: true,
      reason: "SON",
      label: "Sonderanlagen.",
    };
  }

  if (code.startsWith("BETR")) {
    return {
      credits: 50,
      automatic: true,
      reason: "BETR",
      label: "Neue Anforderungen an den Betrieb.",
    };
  }

  if (code.startsWith("MVO")) {
    return {
      credits: 100,
      automatic: true,
      reason: "MVO",
      label: "MVO.",
    };
  }

  if (code.startsWith("MOD")) {
    return {
      credits: 100,
      automatic: true,
      reason: "MOD",
      label: "Modernisierung.",
    };
  }

  if (code.startsWith("BRG")) {
    return {
      credits: 150,
      automatic: true,
      reason: "BRG",
      label: "Berechnungen.",
    };
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
    return {
      credits: 150,
      automatic: true,
      reason: "GEF",
      label: "Gefährdungsbeurteilung.",
    };
  }

  if (code.startsWith("FRQ")) {
    return {
      credits: 100,
      automatic: true,
      reason: "FRQ",
      label: "Frequenzumrichter.",
    };
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
    label:
      "Schulungscode wurde keiner automatischen Credit-Regel zugeordnet.",
  };
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

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return {
      ok: false as const,
      response: fail("UNAUTHENTICATED", 401),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      ok: false as const,
      response: fail("FORBIDDEN", 403),
    };
  }

  return {
    ok: true as const,
    admin: user,
  };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.response;
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return fail("INVALID_JSON", 400);
  }

  const training = body as IncomingCobraTraining;

  const cobraId = cleanNumber(training.cobraId);
  const code = cleanString(training.code);
  const title = cleanString(training.title) ?? code ?? cleanString(training.caption);
  const startDate = parseDate(cleanString(training.date));
  const endDate = parseDate(cleanString(training.endDate));
  const location = cleanString(training.location);
  const instructor = cleanString(training.instructor);
  const description = cleanString(training.description);

  if (!cobraId) {
    return fail("MISSING_COBRA_ID", 400);
  }

  if (!code) {
    return fail("MISSING_CODE", 400);
  }

  if (!title) {
    return fail("MISSING_TITLE", 400);
  }

  if (!startDate) {
    return fail("INVALID_START_DATE", 400);
  }

  const creditRule = deriveCredits(training);

  const existingTraining = await prisma.training.findFirst({
    where: {
      code,
    },
    select: {
      id: true,
      title: true,
      code: true,
      date: true,
      endDate: true,
      location: true,
      instructor: true,
      description: true,
      creditsAward: true,
      certificateKind: true,
    },
  });

  const action = existingTraining ? "UPDATE_EXISTING_BY_CODE" : "CREATE_NEW";

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

  if (existingTraining && existingTraining.creditsAward !== creditRule.credits) {
    warnings.push(
      `Bestehende App-Schulung hat ${existingTraining.creditsAward} Credits, Cobra-Regel ergibt ${creditRule.credits} Credits.`
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "PREVIEW_ONLY",
    action,
    cobra: {
      cobraId,
      code,
      title,
      date: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      location,
      instructor,
      description,
    },
    app: {
      exists: Boolean(existingTraining),
      existingTraining,
    },
    proposed: {
      title,
      code,
      date: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      location,
      instructor,
      description,
      creditsAward: creditRule.credits,
      creditRule,
    },
    warnings,
  });
}