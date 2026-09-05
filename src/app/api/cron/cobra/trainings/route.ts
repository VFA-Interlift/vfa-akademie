import { NextResponse } from "next/server";
import { CobraError } from "@/lib/cobra/types";
import { syncCobraTrainings } from "@/lib/cobra/sync-trainings";
import { cronGeprueft } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = cronGeprueft(req);

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
