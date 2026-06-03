import { NextResponse } from "next/server";
import { cobraRequest } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{
    cobraId: string;
  }>;
};

type CobraParticipant = {
  Caption?: string;
  ID?: number;
  SUPERID?: string | null;
  Status?: string | null;
  Teilnehmerart?: string | null;
  Teilnehmer?: string | null;
  Notiz?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function normalizeParticipant(participant: CobraParticipant) {
  return {
    cobraParticipantId: participant.ID ?? null,
    caption: participant.Caption ?? null,
    trainingCaption: participant.SUPERID ?? null,
    status: participant.Status ?? null,
    participantType: participant.Teilnehmerart ?? null,
    participantText: participant.Teilnehmer ?? null,
    note: participant.Notiz ?? null,
    raw: participant,
  };
}

export async function GET(_req: Request, context: Ctx) {
  const { cobraId } = await context.params;
  const cleanCobraId = String(cobraId ?? "").trim();

  if (!cleanCobraId) {
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_COBRA_ID",
      },
      { status: 400 }
    );
  }

  try {
    const data = await cobraRequest<CobraParticipant | CobraParticipant[]>(
      `/api/app-schulung/${encodeURIComponent(cleanCobraId)}/schulungsteilnehmer`,
      { method: "GET" }
    );

    const list = Array.isArray(data) ? data : [data];

    const participants = list.map(normalizeParticipant);

    return NextResponse.json({
      ok: true,
      source: "cobra",
      endpoint: "app-schulung/schulungsteilnehmer",
      cobraId: cleanCobraId,
      count: participants.length,
      participants,
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
        error: "COBRA_PARTICIPANTS_LOAD_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}