import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminEmail = session?.user?.email;
    if (!adminEmail) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

    // Optional: Admin-Check (wenn du Role noch nicht im User hast, erstmal weglassen)
    // const me = await prisma.user.findUnique({ where: { email: adminEmail }, select: { role: true } });
    // if (me?.role !== "ADMIN") return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const trainingId = String(body.trainingId ?? "").trim();

    if (!email || !trainingId) {
      return NextResponse.json({ error: "E-Mail und Training fehlen." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, creditsTotal: true },
      });
      if (!user) return { ok: false as const, status: 404, error: "User nicht gefunden." };

      const training = await tx.training.findUnique({
        where: { id: trainingId },
        select: { id: true, title: true, creditsAward: true },
      });
      if (!training) return { ok: false as const, status: 404, error: "Training nicht gefunden." };

      // schon vorhanden?
      const existing = await tx.badge.findFirst({
        where: { userId: user.id, trainingId: training.id },
        select: { id: true },
      });
      if (existing) {
        return {
          ok: true as const,
          already: true,
          badgeId: existing.id,
          trainingTitle: training.title,
          creditsAwarded: 0,
          creditsTotal: user.creditsTotal,
        };
      }

      // Badge erstellen
      const badge = await tx.badge.create({
        data: { userId: user.id, trainingId: training.id },
        select: { id: true },
      });

      const award = training.creditsAward ?? 0;

      if (award !== 0) {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: award,
            type: "AWARD",
            reason: "TRAINING_CLAIM", // oder ADMIN_ADJUST wenn du sauber trennen willst
            trainingId: training.id,
            badgeId: badge.id,
            meta: { by: adminEmail, mode: "manual" },
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { creditsTotal: { increment: award } },
        });
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { creditsTotal: true },
      });

      return {
        ok: true as const,
        already: false,
        badgeId: badge.id,
        trainingTitle: training.title,
        creditsAwarded: award,
        creditsTotal: updatedUser?.creditsTotal ?? 0,
      };
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Unique (userId, trainingId) – doppelklick
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }
    console.error(e);
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}
