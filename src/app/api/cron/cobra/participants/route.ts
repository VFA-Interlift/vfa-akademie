import { NextResponse } from "next/server";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CobraParticipantRaw = {
  Caption?: string | null;
  ID?: number | string | null;
  "Teilnehmer ID"?: number | string | null;
  "Schulungs ID"?: string | null;
  SUPERID?: string | null;
  Teilnehmer?: string | null;
  "Teilnehmer Art"?: string | null;
  Teilnehmerart?: string | null;
  Status?: string | null;
  Notiz?: string | null;
};

type NormalizedCobraParticipant = {
  cobraParticipantId: string;
  cobraTrainingCaption: string | null;
  cobraTrainingId: string | null;
  caption: string | null;
  participantText: string;
  participantType: string | null;
  status: string | null;
  raw: CobraParticipantRaw;
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
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

function extractCobraTrainingId(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^#?(\d+)/);

  return match?.[1] ?? null;
}

function normalizeParticipant(
  raw: CobraParticipantRaw
): NormalizedCobraParticipant | null {
  const numericParticipantId = cleanNumber(raw["Teilnehmer ID"] ?? raw.ID);

  const cobraTrainingCaption = cleanString(
    raw["Schulungs ID"] ?? raw.SUPERID
  );

  const cobraTrainingId = extractCobraTrainingId(cobraTrainingCaption);

  const caption = cleanString(raw.Caption);

  const participantText =
    cleanString(raw.Teilnehmer) ?? cleanString(raw.Caption);

  const participantType = cleanString(
    raw["Teilnehmer Art"] ?? raw.Teilnehmerart
  );

  const status = cleanString(raw.Status);

  if (!numericParticipantId || !participantText) {
    return null;
  }

  return {
    cobraParticipantId: String(numericParticipantId),
    cobraTrainingCaption,
    cobraTrainingId,
    caption,
    participantText,
    participantType,
    status,
    raw,
  };
}

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return {
      ok: false as const,
      response: fail("CRON_SECRET_NOT_CONFIGURED", 500),
    };
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false as const,
      response: fail("UNAUTHORIZED", 401),
    };
  }

  return {
    ok: true as const,
  };
}

async function syncParticipant(participant: NormalizedCobraParticipant) {
  const training = participant.cobraTrainingId
    ? await prisma.training.findUnique({
        where: {
          cobraId: participant.cobraTrainingId,
        },
        select: {
          id: true,
          cobraId: true,
          code: true,
          title: true,
        },
      })
    : null;

  const synced = await prisma.cobraTrainingParticipant.upsert({
    where: {
      cobraParticipantId: participant.cobraParticipantId,
    },
    create: {
      cobraParticipantId: participant.cobraParticipantId,
      cobraTrainingCaption: participant.cobraTrainingCaption,
      cobraTrainingId: participant.cobraTrainingId,
      trainingId: training?.id ?? null,
      caption: participant.caption,
      participantText: participant.participantText,
      participantType: participant.participantType,
      status: participant.status,
      raw: participant.raw,
    },
    update: {
      cobraTrainingCaption: participant.cobraTrainingCaption,
      cobraTrainingId: participant.cobraTrainingId,
      trainingId: training?.id ?? null,
      caption: participant.caption,
      participantText: participant.participantText,
      participantType: participant.participantType,
      status: participant.status,
      raw: participant.raw,
    },
    select: {
      id: true,
      cobraParticipantId: true,
      cobraTrainingId: true,
      cobraTrainingCaption: true,
      trainingId: true,
      participantText: true,
      participantType: true,
      status: true,
    },
  });

  return {
    synced,
    linkedTraining: training,
  };
}

export async function GET(req: Request) {
  const gate = isAuthorized(req);

  if (!gate.ok) {
    return gate.response;
  }

  try {
    const cobraParticipants = await cobraEndpointGet<CobraParticipantRaw[]>(
      "schulungsteilnehmer"
    );

    const normalized: NormalizedCobraParticipant[] = [];
    const skipped: Array<{
      reason: string;
      raw: CobraParticipantRaw;
    }> = [];

    for (const rawParticipant of cobraParticipants) {
      const item = normalizeParticipant(rawParticipant);

      if (!item) {
        skipped.push({
          reason: "MISSING_REQUIRED_FIELDS",
          raw: rawParticipant,
        });
        continue;
      }

      normalized.push(item);
    }

    let linkedToTraining = 0;
    let withoutTrainingLink = 0;

    const synced: Array<{
      id: string;
      cobraParticipantId: string;
      cobraTrainingId: string | null;
      cobraTrainingCaption: string | null;
      trainingId: string | null;
      participantText: string;
      participantType: string | null;
      status: string | null;
      linkedTrainingCode: string | null;
      linkedTrainingTitle: string | null;
    }> = [];

    for (const participant of normalized) {
      const result = await syncParticipant(participant);

      if (result.linkedTraining) {
        linkedToTraining += 1;
      } else {
        withoutTrainingLink += 1;
      }

      synced.push({
        id: result.synced.id,
        cobraParticipantId: result.synced.cobraParticipantId,
        cobraTrainingId: result.synced.cobraTrainingId,
        cobraTrainingCaption: result.synced.cobraTrainingCaption,
        trainingId: result.synced.trainingId,
        participantText: result.synced.participantText,
        participantType: result.synced.participantType,
        status: result.synced.status,
        linkedTrainingCode: result.linkedTraining?.code ?? null,
        linkedTrainingTitle: result.linkedTraining?.title ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      source: "cobra",
      endpoint: "schulungsteilnehmer",
      mode: "PARTICIPANTS_RAW_SYNC_ONLY",
      received: cobraParticipants.length,
      normalized: normalized.length,
      skipped: skipped.length,
      linkedToTraining,
      withoutTrainingLink,
      synced,
      skippedItems: skipped,
      syncedAt: new Date().toISOString(),
      note:
        "Dieser Sync speichert nur Cobra-Teilnehmer-Rohdaten. Es werden keine User, Enrollments, Credits oder Zertifikate erzeugt.",
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
        error: "COBRA_PARTICIPANTS_SYNC_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}