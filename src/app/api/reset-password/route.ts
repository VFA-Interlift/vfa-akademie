import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { absender, bremsePruefen } from "@/lib/bremse";
import { passwortFehler } from "@/lib/passwort";

export async function POST(req: NextRequest) {
  // Zwanzig Versuche je Absender in zehn Minuten: der Token hat 32 Byte Zufall,
  // die Bremse hält nur das Durchprobieren in Grenzen.
  const bremse = bremsePruefen(`reset:${absender(req)}`, {
    versuche: 20,
    fensterSekunden: 600,
    sperreSekunden: 900,
  });

  if (!bremse.erlaubt) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte versuch es später noch einmal." },
      { status: 429 }
    );
  }

  const { token, password } = await req.json();

  if (!token || !password || typeof token !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Der Link ist ungültig oder bereits abgelaufen." },
      { status: 400 }
    );
  }

  const passwortProblem = passwortFehler(password, {
    email: record.user.email,
    name: record.user.name,
  });

  if (passwortProblem) {
    return NextResponse.json({ error: passwortProblem }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
