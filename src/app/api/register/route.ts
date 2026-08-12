import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  sendEmailVerificationEmail,
  sendNewRegistrationNotificationEmail,
} from "@/lib/email";
import { absender, bremsePruefen } from "@/lib/bremse";
import { passwortFehler } from "@/lib/passwort";

export const dynamic = "force-dynamic";

function buildUtcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValid ? date : null;
}

/**
 * Akzeptiert sowohl ISO `YYYY-MM-DD` (vom nativen Datumsfeld) als auch das
 * deutsche `TT.MM.JJJJ` (für Abwärtskompatibilität / manuelle Eingabe).
 */
function parseBirthDate(value: string): Date | null {
  const trimmed = value.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return buildUtcDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const deMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (deMatch) {
    return buildUtcDate(Number(deMatch[3]), Number(deMatch[2]), Number(deMatch[1]));
  }

  return null;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: null,
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function bestaetigungsLink(token: string) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vfa-akademie.vercel.app"
  ).replace(/\/$/, "");

  return `${appUrl}/e-mail-bestaetigen?token=${token}`;
}

export async function POST(req: Request) {
  // Fünf Registrierungen je Absender in zehn Minuten. Sonst ließen sich Konten
  // reihenweise anlegen und damit Bestätigungsmails verschicken.
  const bremse = bremsePruefen(`register:${absender(req)}`, {
    versuche: 5,
    fensterSekunden: 600,
    sperreSekunden: 900,
  });

  if (!bremse.erlaubt) {
    return NextResponse.json(
      { ok: false, error: "Zu viele Versuche. Bitte versuch es später noch einmal." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const birthDateStr = String(body.birthDate ?? "").trim();

    if (!email || !password || !name || !birthDateStr) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte alle Felder ausfüllen.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte eine gültige E-Mail-Adresse eingeben.",
        },
        { status: 400 }
      );
    }

    const passwortProblem = passwortFehler(password, { email, name });
    if (passwortProblem) {
      return NextResponse.json({ ok: false, error: passwortProblem }, { status: 400 });
    }

    const birthDate = parseBirthDate(birthDateStr);

    if (!birthDate) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte ein gültiges Geburtsdatum angeben.",
        },
        { status: 400 }
      );
    }

    if (birthDate.getTime() > Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Das Geburtsdatum darf nicht in der Zukunft liegen.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Vorhandenes Konto wird immer abgewiesen — auch ein unbestätigtes.
    //
    // Hier stand kurzzeitig eine Löschung unbestätigter Konten, um deren
    // Inhaber nicht auszusperren. Das war falsch: Dieser Endpunkt braucht weder
    // Anmeldung noch Passwort noch Token, ein POST mit fremder Adresse hätte
    // also gereicht — und über die Kaskaden hätte es Anmeldungen, Zertifikate,
    // Credits und hochgeladene Nachweise mitgerissen. Dass „unbestätigt"
    // gleich „gehört niemandem" bedeutet, gilt nur für einen Entstehungsweg;
    // die Demo-Skripte etwa legen Konten ohne dieses Feld an.
    //
    // Der Fall, den die Löschung abfangen sollte, kann praktisch nicht
    // eintreten: Die Migration hat alle Bestandskonten auf bestätigt gesetzt,
    // und neue entstehen nur noch über den Bestätigungslink. Sollte doch eines
    // auftauchen, gehört die Entscheidung nach /api/verify-email — dort ist
    // durch den angeklickten Link belegt, dass die Mail angekommen ist.
    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: "E-Mail ist bereits registriert.",
        },
        { status: 409 }
      );
    }

    // Das Konto entsteht NICHT hier, sondern erst beim Anklicken des
    // Bestätigungslinks (/api/verify-email). Der Grund: Sonst könnte jemand ein
    // Konto auf eine fremde Adresse anlegen, und der echte Adressinhaber würde
    // es beim Bestätigen freischalten — mit dem Passwort des anderen darin.
    //
    // Bis zur Bestätigung hängen die Angaben am Token.
    //
    // Mehrere offene Anforderungen für dieselbe Adresse bleiben nebeneinander
    // bestehen; aufgeräumt wird erst beim Einlösen. Das ist wichtig: Würde eine
    // neue Anforderung die vorherige löschen, könnte jemand nach dem echten
    // Inhaber registrieren — dessen eigener Link liefe ins Leere, und der
    // einzige noch funktionierende trüge das Passwort des anderen. Genau die
    // Fehlermeldung hätte ihn dann zur falschen Mail getrieben.
    const passwordHash = await bcrypt.hash(password, 12);
    const { firstName, lastName } = splitName(name);
    const token = randomBytes(32).toString("hex");

    await prisma.offeneRegistrierung.create({
      data: {
        token,
        email,
        passwordHash,
        name,
        firstName,
        lastName,
        birthDate,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    let mailVersandt = true;
    try {
      await sendEmailVerificationEmail(email, bestaetigungsLink(token));
    } catch (mailError) {
      // Ohne Mail kommt niemand weiter — auffindbar protokollieren. Die
      // Registrierung lässt sich einfach wiederholen, ein Konto ist ja noch
      // nicht entstanden. Dem Nutzer sagen wir es ehrlich, statt ihn auf eine
      // Mail warten zu lassen, die nie kommt (stiller Totalausfall).
      console.error("REGISTER_VERIFY_MAIL_ERROR", mailError);
      mailVersandt = false;
    }

    // Die interne Benachrichtigung geht erst nach der Bestätigung raus (siehe
    // /api/verify-email). Sonst bekäme die Geschäftsstelle auch Meldungen über
    // Registrierungen, aus denen nie ein Konto wird — und jeder könnte ihr über
    // fremde Adressen Post schicken.

    if (!mailVersandt) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Dein Konto ist vorbereitet, aber die Bestätigungsmail konnte gerade " +
            "nicht versendet werden. Bitte versuch es in ein paar Minuten noch einmal.",
          mailFehler: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      bestaetigungNoetig: true,
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Serverfehler: ${
                error instanceof Error ? error.message : String(error)
              }`
            : "Serverfehler.",
      },
      { status: 500 }
    );
  }
}