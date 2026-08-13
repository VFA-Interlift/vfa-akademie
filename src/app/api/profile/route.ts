import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailChangeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Einfache Formatprüfung: genau ein @, davor und danach etwas, ein Punkt in der
// Domain. Kein Vollständigkeits-Anspruch, aber sie hält "x" oder Tippfehler ab.
function istEmailFormat(wert: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert);
}

function verifyLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://vfa-akademie.vercel.app";
  return `${base.replace(/\/$/, "")}/e-mail-bestaetigen?token=${token}`;
}

function parseGermanDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Nicht eingeloggt." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const currentEmail = session.user.email.trim().toLowerCase();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "E-Mail ist Pflicht." },
        { status: 400 }
      );
    }

    if (!istEmailFormat(email)) {
      return NextResponse.json(
        { ok: false, error: "Bitte gib eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);

    const fallbackName = cleanString(body.name);
    const fullName =
      firstName || lastName
        ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
        : fallbackName;

    const birthDateStr =
      typeof body.birthDate === "string" ? body.birthDate.trim() : "";

    const birthDate = birthDateStr ? parseGermanDate(birthDateStr) : null;

    if (birthDateStr && !birthDate) {
      return NextResponse.json(
        { ok: false, error: "Geburtsdatum muss TT.MM.JJJJ sein." },
        { status: 400 }
      );
    }

    if (birthDate && (birthDate > new Date() || birthDate.getFullYear() < 1900)) {
      return NextResponse.json(
        { ok: false, error: "Das Geburtsdatum liegt außerhalb des gültigen Bereichs." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email: currentEmail,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "User nicht gefunden." },
        { status: 404 }
      );
    }

    if (email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { ok: false, error: "Diese E-Mail ist bereits vergeben." },
          { status: 409 }
        );
      }
    }

    const emailChanged = email !== currentUser.email;

    // Nur Felder schreiben, die der Client tatsächlich mitschickt. Sonst würde
    // ein PATCH, der nur die Telefonnummer ändert, alle übrigen Angaben
    // (Geburtsdatum, Firma, …) auf null radieren. `undefined` lässt Prisma das
    // Feld unangetastet.
    function wenn<T>(schluessel: string, wert: T): T | undefined {
      return schluessel in body ? wert : undefined;
    }

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        // Die Adresse wechselt NICHT hier: Erst wenn der Bestätigungslink an
        // die neue Adresse eingelöst wird, zieht das Konto um (pendingEmail
        // am Token). Vorher sperrte ein Tippfehler das Konto aus.
        name: firstName || lastName || "name" in body ? fullName : undefined,
        firstName: wenn("firstName", firstName),
        lastName: wenn("lastName", lastName),
        birthDate: wenn("birthDate", birthDate),
        gender: wenn("gender", cleanString(body.gender)),
        phone: wenn("phone", cleanString(body.phone)),

        company: wenn("company", cleanString(body.company)),
        companyAddress: wenn("companyAddress", cleanString(body.companyAddress)),
        companyStreet: wenn("companyStreet", cleanString(body.companyStreet)),
        companyZip: wenn("companyZip", cleanString(body.companyZip)),
        companyCity: wenn("companyCity", cleanString(body.companyCity)),
        companyCountry: wenn("companyCountry", cleanString(body.companyCountry)),
        position: wenn("position", cleanString(body.position)),

      },
    });

    // Adresswechsel: Bestätigungslink an die NEUE Adresse; das Konto läuft
    // bis zum Einlösen unter der alten weiter. Scheitert der Versand, erfährt
    // es der Nutzer — vorher wurde der Fehler verschluckt und als Erfolg
    // gemeldet (Ultracode-Befund 13.08.2026).
    if (emailChanged) {
      const token = randomBytes(32).toString("hex");
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: currentUser.id,
          pendingEmail: email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      try {
        await sendEmailChangeEmail(email, verifyLink(token));
      } catch (mailError) {
        console.error("PROFILE_EMAIL_CHANGE_VERIFY_MAIL_ERROR", mailError);
        await prisma.emailVerificationToken.deleteMany({ where: { token } });
        return NextResponse.json(
          {
            ok: false,
            error:
              "Die Bestätigungsmail an die neue Adresse konnte nicht gesendet werden. Deine bisherige Adresse bleibt aktiv — bitte versuch es später erneut.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      emailChanged,
      ...(emailChanged ? { pendingEmail: email } : {}),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Serverfehler." },
      { status: 500 }
    );
  }
}