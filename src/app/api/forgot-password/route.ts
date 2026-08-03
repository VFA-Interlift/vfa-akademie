import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { absender, bremsePruefen } from "@/lib/bremse";

export async function POST(req: NextRequest) {
  // Fünf Anforderungen je Absender in zehn Minuten. Ohne Bremse ließe sich das
  // Postfach eines Nutzers mit Reset-Mails fluten.
  const bremse = bremsePruefen(`forgot:${absender(req)}`, {
    versuche: 5,
    fensterSekunden: 600,
    sperreSekunden: 900,
  });

  if (!bremse.erlaubt) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte versuch es später noch einmal." },
      { status: 429 }
    );
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://vfa-akademie.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(normalizedEmail, resetUrl);
  }

  return NextResponse.json({ ok: true });
}
