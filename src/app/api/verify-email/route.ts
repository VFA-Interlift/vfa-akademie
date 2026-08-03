import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anmeldungenNachziehen } from "@/lib/anmeldungen-nachziehen";

export const dynamic = "force-dynamic";

/**
 * Löst den Bestätigungslink aus der Registrierungsmail ein: markiert die
 * Adresse als belegt und verbindet das Konto erst dann mit den vorliegenden
 * Kursanmeldungen.
 */
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown };

  if (!token || typeof token !== "string") {
    return NextResponse.json({ ok: false, error: "UNGUELTIG" }, { status: 400 });
  }

  const eintrag = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!eintrag || eintrag.usedAt !== null || eintrag.expiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: "Der Link ist ungültig oder abgelaufen." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: eintrag.userId },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true },
  });

  await prisma.emailVerificationToken.update({
    where: { id: eintrag.id },
    data: { usedAt: new Date() },
  });

  let uebernommen = 0;
  try {
    uebernommen = await anmeldungenNachziehen(user.id, user.email);
  } catch (fehler) {
    // Die Bestätigung selbst ist gelungen und darf nicht daran scheitern —
    // ohne Protokoll fehlten dem Nutzer aber Schulungen ohne erkennbaren Grund.
    console.error("VERIFY_EMAIL_ENROLL_ERROR", fehler);
  }

  return NextResponse.json({ ok: true, uebernommeneSchulungen: uebernommen });
}
