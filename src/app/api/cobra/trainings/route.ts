import { NextResponse } from "next/server";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";
import { pickCobraLocation } from "@/lib/cobra/sync-trainings";

export const dynamic = "force-dynamic";

type CobraTraining = {
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function normalizeTraining(training: CobraTraining) {
  const instructors = [
    training.Dozent,
    training["Dozent 2"],
    training["Dozent 3"],
    training["Dozent 4"],
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const cobraId = training["Schulungs-ID"] ?? training.ID ?? null;

  return {
    cobraId,
    caption: training.Caption ?? null,
    code: training.Schulungscode ?? null,
    title:
      training.Schulungstitel ??
      training.Schulungscode ??
      training.Caption ??
      null,
    date: training.Startdatum ?? null,
    endDate: training.Enddatum ?? null,
    location: pickCobraLocation(training as Record<string, unknown>),
    instructor: instructors.join(" | ") || null,
    instructors,
    description: training.Beschreibung ?? null,
    raw: training,
  };
}

export async function GET() {
  try {
    const data = await cobraEndpointGet<CobraTraining[]>("app-schulung");

    const trainings = Array.isArray(data) ? data.map(normalizeTraining) : [];

    return NextResponse.json({
      ok: true,
      source: "cobra",
      endpoint: "app-schulung",
      count: trainings.length,
      trainings,
    });
  } catch (error: unknown) {
    if (error instanceof CobraError) {
      return NextResponse.json(
        {
          ok: false,
          error: "COBRA_ERROR",
          message: error.message,
          status: error.status ?? 500,
          details: error.details,
        },
        { status: error.status ?? 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "COBRA_TRAININGS_LOAD_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}