import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCertificateKind } from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

function guessCategory(code: string | null, title: string) {
  const normalizedCode = String(code ?? "").toUpperCase();
  const normalizedTitle = title.toLowerCase();

  if (["A1", "A2", "B", "C"].includes(normalizedCode)) {
    return "VDI";
  }

  if (normalizedCode.includes("EFK") || normalizedTitle.includes("elektro")) {
    return "Elektrotechnik";
  }

  if (
    normalizedCode.includes("SICH") ||
    normalizedCode.includes("DGUV") ||
    normalizedCode.includes("FFPW")
  ) {
    return "Praxis";
  }

  return "Schwerpunkte";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET() {
  try {
    const trainings = await prisma.training.findMany({
      orderBy: {
        date: "asc",
      },
      select: {
        id: true,
        title: true,
        code: true,
        certificateKind: true,
        date: true,
        endDate: true,
        location: true,
        instructor: true,
        description: true,
        creditsAward: true,
      },
    });

    const mappedTrainings = trainings.map((training) => ({
      id: training.id,
      title: training.title,
      code: training.code,
      category: guessCategory(training.code, training.title),
      certificateKind: training.certificateKind,
      certificateKindLabel: formatCertificateKind(training.certificateKind),
      date: training.date.toISOString(),
      endDate: training.endDate ? training.endDate.toISOString() : null,
      location: training.location,
      instructor: training.instructor,
      description: training.description,
      creditsAward: training.creditsAward,
      isPublic: true,
    }));

    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      trainings: mappedTrainings,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "PUBLIC_TRAININGS_LOAD_FAILED",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}