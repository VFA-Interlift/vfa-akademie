import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden." }, { status: 404 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.claimToken.findUnique({
        where: { token },
        include: { training: true },
      });

      if (!claim) {
        return { ok: false as const, status: 404, error: "Ungültiger Code." };
      }

      if (now > claim.expiresAt) {
        return { ok: false as const, status: 410, error: "Code ist abgelaufen." };
      }

      // Schon geclaimt?
      const existing = await tx.badge.findFirst({
        where: { userId: user.id, trainingId: claim.trainingId },
        select: { id: true },
      });

      if (existing) {
        const u = await tx.user.findUnique({
          where: { id: user.id },
          select: { creditsTotal: true },
        });

        return {
          ok: true as const,
          already: true,
          trainingTitle: claim.training.title,
          creditsAwarded: 0,
          creditsTotal: u?.creditsTotal ?? 0,
        };
      }

      // maxClaims atomar sichern (race-safe)
      const updated = await tx.claimToken.updateMany({
        where: {
          id: claim.id,
          expiresAt: { gt: now },
          claims: { lt: claim.maxClaims },
        },
        data: { claims: { increment: 1 } },
      });

      if (updated.count !== 1) {
        return {
          ok: false as const,
          status: 409,
          error: "Maximale Teilnehmerzahl erreicht.",
        };
      }

      // Badge erstellen
      const badge = await tx.badge.create({
        data: { userId: user.id, trainingId: claim.trainingId },
        select: { id: true },
      });

      const award = claim.training.creditsAward ?? 0;

      // Credits buchen
      if (award !== 0) {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: award,
            type: "AWARD",
            reason: "TRAINING_CLAIM",
            trainingId: claim.trainingId,
            badgeId: badge.id,
            claimTokenId: claim.id,
            meta: { token },
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { creditsTotal: { increment: award } },
        });
      }

      const u = await tx.user.findUnique({
        where: { id: user.id },
        select: { creditsTotal: true },
      });

      return {
        ok: true as const,
        already: false,
        trainingTitle: claim.training.title,
        creditsAwarded: award,
        creditsTotal: u?.creditsTotal ?? 0,
      };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      already: result.already,
      trainingTitle: result.trainingTitle,
      creditsAwarded: result.creditsAwarded,
      creditsTotal: result.creditsTotal,
    });
  } catch (e: any) {
    // falls Badge unique knallt (sehr selten in diesem Flow)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }

    console.error(e);
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}