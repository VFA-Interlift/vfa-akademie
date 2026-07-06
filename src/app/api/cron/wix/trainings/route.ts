import { NextResponse } from "next/server";
import { syncWixTrainings } from "@/lib/wix/sync-trainings";

export const dynamic = "force-dynamic";

/**
 * Täglicher Sync der Wix-Collection „Schulungen" in die App-DB (führende Quelle
 * für den Kurskalender). Läuft vor dem Anmeldungs-Sync, damit dieser die
 * trainingId per Kurscode verknüpfen kann. Auth: `Bearer <CRON_SECRET>`.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await syncWixTrainings();
    return NextResponse.json({ ok: true, source: "wix", collection: "Schulungen", ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "WIX_TRAININGS_SYNC_FAILED",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
