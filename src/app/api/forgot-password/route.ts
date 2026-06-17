import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
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
