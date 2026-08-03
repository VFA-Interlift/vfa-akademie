import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anmeldungenNachziehen } from "@/lib/anmeldungen-nachziehen";

export const dynamic = "force-dynamic";

/**
 * Löst den Bestätigungslink aus der Registrierungsmail ein.
 *
 * Zwei Fälle:
 *  - Offene Registrierung (Regelfall): Das Konto wird JETZT erst angelegt, mit
 *    den Angaben, die am Token hängen. Vorher gab es keines — sonst hätte
 *    jemand ein Konto auf eine fremde Adresse eröffnen können, das der echte
 *    Inhaber mit fremdem Passwort freischaltet.
 *  - Bestehendes Konto: Für Konten aus der Übergangszeit, die schon angelegt
 *    wurden, aber noch unbestätigt sind.
 *
 * Erst nach der Bestätigung werden vorliegende Kursanmeldungen verbunden.
 */
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown };

  if (!token || typeof token !== "string") {
    return NextResponse.json({ ok: false, error: "UNGUELTIG" }, { status: 400 });
  }

  const jetzt = new Date();

  const offen = await prisma.offeneRegistrierung.findUnique({
    where: { token },
  });

  if (offen) {
    if (offen.expiresAt < jetzt) {
      await prisma.offeneRegistrierung.delete({ where: { id: offen.id } });
      return NextResponse.json(
        { ok: false, error: "Der Link ist abgelaufen. Bitte registriere dich erneut." },
        { status: 400 }
      );
    }

    // Zwischenzeitlich angelegtes Konto (z. B. von der Geschäftsstelle):
    // dann nur aufräumen und auf die Anmeldung verweisen.
    const schonDa = await prisma.user.findUnique({
      where: { email: offen.email },
      select: { id: true },
    });

    if (schonDa) {
      await prisma.offeneRegistrierung.delete({ where: { id: offen.id } });
      return NextResponse.json(
        { ok: false, error: "Für diese Adresse gibt es bereits ein Konto. Bitte melde dich an." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: offen.email,
        passwordHash: offen.passwordHash,
        name: offen.name,
        firstName: offen.firstName,
        lastName: offen.lastName,
        birthDate: offen.birthDate,
        emailVerifiedAt: jetzt,
      },
      select: { id: true, email: true },
    });

    await prisma.offeneRegistrierung.delete({ where: { id: offen.id } });

    let uebernommen = 0;
    try {
      uebernommen = await anmeldungenNachziehen(user.id, user.email);
    } catch (fehler) {
      // Das Konto steht und darf daran nicht scheitern — ohne Protokoll fehlten
      // dem Nutzer aber Schulungen ohne erkennbaren Grund.
      console.error("VERIFY_EMAIL_ENROLL_ERROR", fehler);
    }

    return NextResponse.json({ ok: true, uebernommeneSchulungen: uebernommen });
  }

  // Übergangsfall: Konto besteht bereits und wartet auf die Bestätigung.
  const eintrag = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!eintrag || eintrag.usedAt !== null || eintrag.expiresAt < jetzt) {
    return NextResponse.json(
      { ok: false, error: "Der Link ist ungültig oder abgelaufen." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: eintrag.userId },
    data: { emailVerifiedAt: jetzt },
    select: { id: true, email: true },
  });

  await prisma.emailVerificationToken.update({
    where: { id: eintrag.id },
    data: { usedAt: jetzt },
  });

  let uebernommen = 0;
  try {
    uebernommen = await anmeldungenNachziehen(user.id, user.email);
  } catch (fehler) {
    console.error("VERIFY_EMAIL_ENROLL_ERROR", fehler);
  }

  return NextResponse.json({ ok: true, uebernommeneSchulungen: uebernommen });
}
