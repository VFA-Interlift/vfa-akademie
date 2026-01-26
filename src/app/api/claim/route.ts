import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden." }, { status: 404 });
    }

    // Alles in EINER Transaktion: sicher bei vielen gleichzeitigen Scans
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.claimToken.findUnique({
        where: { token },
        include: { training: true },
      });

      if (!claim) {
        return { ok: false as const, status: 404, error: "Ungültiger Code." };
      }

      if (new Date() > claim.expiresAt) {
        return { ok: false as const, status: 410, error: "Code ist abgelaufen." };
      }

      if (claim.claims >= claim.maxClaims) {
        return { ok: false as const, status: 409, error: "Maximale Teilnehmerzahl erreicht." };
      }

      const existing = await tx.badge.findFirst({
        where: { userId: user.id, trainingId: claim.trainingId },
      });
      if (existing) {
        return { ok: true as const, already: true, trainingTitle: claim.training.title };
      }

      // Badge erstellen
      await tx.badge.create({
        data: { userId: user.id, trainingId: claim.trainingId },
      });

      // claims hochzählen
      await tx.claimToken.update({
        where: { id: claim.id },
        data: { claims: { increment: 1 } },
      });

      return { ok: true as const, already: false, trainingTitle: claim.training.title };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      already: result.already,
      trainingTitle: result.trainingTitle,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}
