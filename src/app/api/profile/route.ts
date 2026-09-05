import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailChangeEmail } from "@/lib/email";
import { bremsePruefen } from "@/lib/bremse";
import { deutschesDatum } from "@/lib/trainings/format";

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

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  // Längenbegrenzung wie bei den anderen Routen (Befund f05-8, 05.09.2026).
  const trimmed = value.trim().slice(0, 200);
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

    const birthDate = birthDateStr ? deutschesDatum(birthDateStr) : null;

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
        name: true,
        firstName: true,
        lastName: true,
        isInstructor: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "Konto nicht gefunden." },
        { status: 404 }
      );
    }

    // Dozenten ändern ihren Namen nicht selbst: Der Dozentenbereich ordnet
    // Kurse allein über den Namensabgleich zu, ein umbenannter Dozent bekäme
    // die Kurse eines anderen (Befund f06-1, 05.09.2026). Unveränderte Werte
    // dürfen mitgeschickt werden, nur eine Abweichung wird abgelehnt.
    if (currentUser.isInstructor) {
      const vornameNeu = "firstName" in body ? firstName : currentUser.firstName;
      const nachnameNeu = "lastName" in body ? lastName : currentUser.lastName;
      const nameNeu = !firstName && !lastName && "name" in body ? fallbackName : currentUser.name;
      if (
        vornameNeu !== currentUser.firstName ||
        nachnameNeu !== currentUser.lastName ||
        nameNeu !== currentUser.name
      ) {
        return NextResponse.json(
          { ok: false, error: "Dein Name wird vom Admin gepflegt." },
          { status: 403 }
        );
      }
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

    // Jeder Adresswechsel schickt eine Mail an eine frei wählbare Adresse —
    // ohne Bremse ließe sich damit jede Adresse im Namen der Akademie
    // beschicken (Befund f05-7, 05.09.2026). Vor dem Schreiben prüfen, damit
    // nicht die übrigen Felder gespeichert sind und nur die Mail fehlt.
    if (emailChanged) {
      const bremse = bremsePruefen(`adresswechsel:${currentEmail}`, {
        versuche: 3,
        fensterSekunden: 3600,
        sperreSekunden: 3600,
      });
      if (!bremse.erlaubt) {
        return NextResponse.json(
          { ok: false, error: "Zu viele Adresswechsel in kurzer Zeit. Bitte in einer Stunde erneut versuchen." },
          { status: 429 }
        );
      }
    }

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
              "Die Bestätigungsmail an die neue Adresse konnte nicht gesendet werden. Deine bisherige Adresse bleibt aktiv. Bitte versuch es später erneut.",
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