import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { absender, bremsePruefen } from "@/lib/bremse";

export async function POST(req: NextRequest) {
  // Ungefangen ergab ein kaputter Body 500 statt 400 (Befund f05-2).
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = body?.email;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Ohne Bremse ließe sich das Postfach eines Nutzers mit Reset-Mails fluten.
  // Zwei Zähler wie bei der Registrierung (Befund f01-10, 05.09.2026): je
  // Absender 30 in zehn Minuten (Firmen-NAT, Schulungs-WLAN), je Absender UND
  // Adresse fünf — das schützt das einzelne Postfach.
  const ip = absender(req);
  const fenster = { fensterSekunden: 600, sperreSekunden: 900 };
  const bremseNetz = bremsePruefen(`forgot:${ip}`, { versuche: 30, ...fenster });
  const bremseAdresse = bremsePruefen(`forgot:${ip}:${normalizedEmail}`, { versuche: 5, ...fenster });

  if (!bremseNetz.erlaubt || !bremseAdresse.erlaubt) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuch es später noch einmal." },
      { status: 429 }
    );
  }

  // Always return success to not reveal whether an account exists
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    // Invalidate existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // Trailing-Slash abschneiden (wie APP_URL in lib/email.ts) — sonst steht
    // im Reset-Link ein doppelter Slash.
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? "https://vfa-akademie.vercel.app"
    ).replace(/\/$/, "");
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Ein Mailfehler darf hier nicht durchschlagen: Die Route antwortet für
    // existierende wie nicht existierende Adressen gleich (verrät nicht, ob ein
    // Konto besteht). Würde der Versand als 500 durchbrechen, wäre genau dieser
    // Fehlerpfad das Unterscheidungsmerkmal. Nur protokollieren.
    try {
      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (mailError) {
      console.error("FORGOT_PASSWORD_MAIL_ERROR", mailError);
    }
  }

  return NextResponse.json({ ok: true });
}
