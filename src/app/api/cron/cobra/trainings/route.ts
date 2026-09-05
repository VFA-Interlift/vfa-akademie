import { NextResponse } from "next/server";
import { CobraError } from "@/lib/cobra/types";
import { syncCobraTrainings } from "@/lib/cobra/sync-trainings";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
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

export async function GET(req: Request) {
  const gate = isAuthorized(req);

  if (!gate.ok) {
    return gate.response;
  }

  try {
    const result = await syncCobraTrainings();

    return NextResponse.json({ ok: true, ...result });
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

    // Fehlertext nur ins Protokoll: Prisma-Meldungen nennen Tabellen und Hosts.
    console.error("COBRA_TRAININGS_SYNC_FAILED", error);
    return NextResponse.json(
      { ok: false, error: "COBRA_TRAININGS_SYNC_FAILED" },
      { status: 500 }
    );
  }
}
