import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anmeldungenNachziehen } from "@/lib/anmeldungen-nachziehen";
import { sendNewRegistrationNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Zeigt vor dem Bestätigen, welche Anforderung an diesem Link hängt.
 *
 * Der Grund: Wer eine Bestätigungsmail anklickt, die er nie angefordert hat,
 * bekäme sonst unbemerkt ein Konto mit fremdem Passwort. Stehen Name und
 * Uhrzeit auf der Seite, fällt ein fremder Vorgang sofort auf.
 *
 * Preisgegeben wird nur, was ohnehin in der Mail an genau diese Adresse steht.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: "UNGUELTIG" }, { status: 400 });
  }

  const offen = await prisma.offeneRegistrierung.findUnique({
    where: { token },
    select: { name: true, email: true, createdAt: true, expiresAt: true },
  });

  if (offen && offen.expiresAt >= new Date()) {
    return NextResponse.json({
      ok: true,
      art: "registrierung",
      name: offen.name,
      email: offen.email,
      angefordertAm: offen.createdAt.toISOString(),
    });
  }

  // Adresswechsel eines bestehenden Kontos: auch hier NACHFRAGEN statt
  // automatisch einlösen. Ohne diese Auskunft wertete die Seite den Link als
  // Übergangsfall und zog das Konto beim bloßen Seitenaufruf um — ein
  // Link-Scanner auf einer Tippfehler-Adresse oder ein neugieriger Klick auf
  // eine unangeforderte Mail hätten gereicht (Gegenprüfung 13.08.2026).
  const wechsel = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: {
      pendingEmail: true,
      usedAt: true,
      expiresAt: true,
      createdAt: true,
      user: { select: { name: true, firstName: true, lastName: true } },
    },
  });

  if (
    wechsel &&
    wechsel.pendingEmail &&
    wechsel.usedAt === null &&
    wechsel.expiresAt >= new Date()
  ) {
    const kontoName =
      [wechsel.user.firstName, wechsel.user.lastName].filter(Boolean).join(" ").trim() ||
      wechsel.user.name;
    return NextResponse.json({
      ok: true,
      art: "adresswechsel",
      name: kontoName,
      email: wechsel.pendingEmail,
      angefordertAm: wechsel.createdAt.toISOString(),
    });
  }

  // Altkonten aus der Übergangszeit haben keine Anforderungsdaten — dort
  // führt der Weg unverändert direkt über POST.
  return NextResponse.json({ ok: false, error: "UNBEKANNT" }, { status: 404 });
}

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
        {
          ok: false,
          kontext: "registrierung",
          error: "Der Link ist abgelaufen. Bitte registriere dich erneut.",
        },
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
      await prisma.offeneRegistrierung.deleteMany({ where: { email: offen.email } });
      return NextResponse.json(
        {
          ok: false,
          kontext: "konto",
          error: "Für diese Adresse gibt es bereits ein Konto. Bitte melde dich an.",
        },
        { status: 409 }
      );
    }

    let user: { id: string; email: string };

    try {
      user = await prisma.user.create({
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
    } catch (fehler) {
      // Zwei Bestätigungen zur selben Zeit: Der Unique-Index auf der Adresse
      // greift, das darf aber keinen Serverfehler geben.
      const code =
        typeof fehler === "object" && fehler && "code" in fehler
          ? String((fehler as { code?: unknown }).code)
          : "";

      if (code === "P2002") {
        await prisma.offeneRegistrierung.deleteMany({ where: { email: offen.email } });
        return NextResponse.json(
          {
            ok: false,
            kontext: "konto",
            error: "Für diese Adresse gibt es bereits ein Konto. Bitte melde dich an.",
          },
          { status: 409 }
        );
      }

      throw fehler;
    }

    // Alle offenen Anforderungen für diese Adresse aufräumen, nicht nur die
    // eingelöste: Sonst bliebe ein zweiter Link gültig, der ein anderes
    // Passwort trägt.
    await prisma.offeneRegistrierung.deleteMany({ where: { email: offen.email } });

    let uebernommen = 0;
    try {
      uebernommen = await anmeldungenNachziehen(user.id, user.email);
    } catch (fehler) {
      // Das Konto steht und darf daran nicht scheitern — ohne Protokoll fehlten
      // dem Nutzer aber Schulungen ohne erkennbaren Grund.
      console.error("VERIFY_EMAIL_ENROLL_ERROR", fehler);
    }

    // Erst jetzt die Geschäftsstelle benachrichtigen: Vorher stand nur eine
    // Absichtserklärung im Raum, jetzt gibt es das Konto wirklich.
    try {
      await sendNewRegistrationNotificationEmail({ name: offen.name, email: offen.email });
    } catch (mailError) {
      console.error("VERIFY_EMAIL_NOTIFY_ERROR", mailError);
    }

    return NextResponse.json({ ok: true, uebernommeneSchulungen: uebernommen });
  }

  // Übergangsfall: Konto besteht bereits und wartet auf die Bestätigung.
  const eintrag = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: { id: true, userId: true, usedAt: true, expiresAt: true, pendingEmail: true },
  });

  if (!eintrag || eintrag.usedAt !== null || eintrag.expiresAt < jetzt) {
    // Bei einem verfallenen Adresswechsel-Link wäre "registriere dich neu"
    // der falsche Rat — der Nutzer HAT ein Konto (Gegenprüfung 13.08.2026).
    if (eintrag?.pendingEmail) {
      return NextResponse.json(
        {
          ok: false,
          kontext: "konto",
          error:
            "Der Link ist ungültig oder abgelaufen. Dein Konto läuft unter der bisherigen Adresse weiter — fordere den Wechsel unter Meine Daten neu an.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Der Link ist ungültig oder abgelaufen." },
      { status: 400 }
    );
  }

  // Trägt der Link eine neue Adresse (Adresswechsel aus "Meine Daten"), zieht
  // das Konto JETZT um. Die Adresse kann inzwischen anderweitig vergeben sein —
  // dann verständlich melden statt Serverfehler (P2002).
  let user: { id: string; email: string };
  try {
    user = await prisma.user.update({
      where: { id: eintrag.userId },
      data: {
        emailVerifiedAt: jetzt,
        ...(eintrag.pendingEmail ? { email: eintrag.pendingEmail.toLowerCase() } : {}),
      },
      select: { id: true, email: true },
    });
  } catch (fehler) {
    const code =
      typeof fehler === "object" && fehler && "code" in fehler
        ? String((fehler as { code?: unknown }).code)
        : "";
    if (code === "P2002") {
      await prisma.emailVerificationToken.update({
        where: { id: eintrag.id },
        data: { usedAt: jetzt },
      });
      return NextResponse.json(
        {
          ok: false,
          kontext: "konto",
          error:
            "Diese Adresse ist inzwischen anderweitig vergeben. Dein Konto läuft unter der bisherigen Adresse weiter — bitte wähle unter Meine Daten eine andere.",
        },
        { status: 409 }
      );
    }
    throw fehler;
  }

  // Weitere offene Links dieses Kontos verfallen — sonst könnte ein älterer
  // Link später eine andere Adresse setzen.
  await prisma.emailVerificationToken.updateMany({
    where: { userId: eintrag.userId, usedAt: null, id: { not: eintrag.id } },
    data: { usedAt: jetzt },
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
