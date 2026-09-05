import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email?.trim().toLowerCase();

  if (!adminEmail) {
    return deny(401, "UNAUTHENTICATED");
  }

  const admin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    return deny(403, "FORBIDDEN");
  }

  const body = await req.json().catch(() => null);

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const note = typeof body?.note === "string" ? body.note.trim() : null;

  const credits = Number(body?.credits);

  if (!email) {
    return deny(400, "INVALID_EMAIL");
  }

  if (!Number.isInteger(credits) || credits === 0) {
    return deny(400, "INVALID_CREDITS");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          creditsTotal: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // Saldo nie unter 0: Eine zu grosse Abzugs-Korrektur soll den Rest
      // abziehen, nicht ein Minus erzeugen (Ultracode-Hinweis 13.08.2026).
      // Atomar als increment plus Klemme — der fruehere Lese-dann-Schreib-Weg
      // konnte einen parallel eingehenden Zuwachs (Feedback-Belohnung,
      // Zertifikats-Cron) ueberschreiben (Gegenpruefung 13.08.2026).
      const nachher = await tx.user.update({
        where: { id: user.id },
        data: { creditsTotal: { increment: credits } },
        select: { creditsTotal: true },
      });
      let creditsTotal = nachher.creditsTotal;
      // Effektiv angewendeter Betrag: Bei einer Klemme auf 0 wird nur der
      // Rest abgezogen — genau das steht dann auch in der Buchung, damit
      // Verlauf und Saldo zusammenpassen.
      let angewendet = credits;
      if (creditsTotal < 0) {
        angewendet = credits - creditsTotal;
        await tx.user.update({
          where: { id: user.id },
          data: { creditsTotal: 0 },
        });
        creditsTotal = 0;
      }

      const creditTx = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: angewendet,
          type: "ADJUSTMENT",
          reason: "ADMIN_ADJUST",
          meta: {
            kind: "ADMIN_MANUAL_CREDITS_ONLY",
            adminId: admin.id,
            note: note ?? undefined,
            ...(angewendet !== credits ? { angefordert: credits, gekappt: true } : {}),
          },
        },
        select: {
          id: true,
        },
      });

      // angewendet mitgeben: Die Oberfläche meldete sonst den angeforderten
      // Betrag, auch wenn auf 0 gekappt wurde (Befund f03-4, 05.09.2026).
      return {
        creditTxId: creditTx.id,
        creditsTotal,
        angewendet,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === "USER_NOT_FOUND") {
      return deny(404, "USER_NOT_FOUND");
    }

    // Rohe Ausnahmetexte gehören ins Protokoll, nicht in die Antwort.
    console.error("ADMIN_CREDITS_FAILED", message);

    return deny(500, "INTERNAL_ERROR");
  }
}