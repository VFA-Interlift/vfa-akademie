import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTrainingReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Temporär: schickt eine Beispiel-Erinnerungsmail. Admin-only.
// Aufruf im Browser (als Admin eingeloggt):
//   /api/admin/debug/test-mail?to=tobias.doehring@vfa-interlift.de
// Nach dem Test wieder entfernen.

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email.trim().toLowerCase() },
        select: { role: true },
      })
    : null;
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const to = new URL(req.url).searchParams.get("to")?.trim() || "tobias.doehring@vfa-interlift.de";
  const from = "VFA-Akademie <info@vfa-akademie.de>";

  try {
    await sendTrainingReminderEmail({
      to,
      name: "Tobias",
      trainingTitle: "A1-2701 – Grundkurs Aufzugstechnik",
      dateText: "26.01.2027",
      location: "VFA-Akademie, Hamburg",
      from,
    });
    return NextResponse.json({ ok: true, to, from });
  } catch (err) {
    return NextResponse.json(
      { ok: false, to, from, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
