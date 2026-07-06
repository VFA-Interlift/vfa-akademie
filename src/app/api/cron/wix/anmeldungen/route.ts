import { NextResponse } from "next/server";
import { syncWixAnmeldungen } from "@/lib/wix/sync-anmeldungen";

export const dynamic = "force-dynamic";

/**
 * Täglicher Sync der Wix-Collection „Schulungsanmeldung" in die App-DB.
 * Auth wie die übrigen Crons: `Authorization: Bearer <CRON_SECRET>`.
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
    const result = await syncWixAnmeldungen();
    return NextResponse.json({ ok: true, source: "wix", collection: "Schulungsanmeldung", ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "WIX_ANMELDUNGEN_SYNC_FAILED",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
