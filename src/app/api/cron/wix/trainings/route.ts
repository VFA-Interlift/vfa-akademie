import { NextResponse } from "next/server";
import { syncWixTrainings } from "@/lib/wix/sync-trainings";

export const dynamic = "force-dynamic";
// Eine Abfrage plus Update je Kurs, danach das Nachziehen der Anmeldungen —
// am Standardlimit bräche Vercel mitten im Lauf ab (Befund 05.09.2026).
export const maxDuration = 300;

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
    // Fehlertext nur ins Protokoll: Prisma-/Fetch-Meldungen nennen Tabellen und Hosts.
    console.error("WIX_TRAININGS_SYNC_FAILED", error);
    return NextResponse.json(
      { ok: false, error: "WIX_TRAININGS_SYNC_FAILED" },
      { status: 500 }
    );
  }
}
