import { NextResponse } from "next/server";
import { sendNewRegistrationNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// TEMPORÄRE Route zum einmaligen Testen der Registrierungs-Benachrichtigung.
// Wird nach erfolgreichem Test wieder entfernt.
const TEST_TOKEN = "vfa-regmail-test-8f3k2p9qw1";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== TEST_TOKEN) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    await sendNewRegistrationNotificationEmail({
      name: "Max Mustermann (Testmail)",
      email: "max.mustermann@example.com",
    });
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
