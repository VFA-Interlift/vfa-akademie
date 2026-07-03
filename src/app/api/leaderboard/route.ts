import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Anonymes Credit-Ranking: sichtbar sind nur Platz 1 (ohne Namen), die eigene
 * Platzierung und der Median aller Teilnehmer. Gerankt werden alle Nutzer mit
 * mehr als 0 Credits – da keine Namen angezeigt werden, ist kein Opt-in nötig.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const [me, participants] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true, creditsTotal: true },
      }),
      prisma.user.findMany({
        where: { creditsTotal: { gt: 0 } },
        orderBy: [{ creditsTotal: "desc" }, { updatedAt: "asc" }],
        select: { id: true, creditsTotal: true },
      }),
    ]);

    if (!me) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const credits = participants.map((p) => p.creditsTotal);
    const first = participants[0] ?? null;

    // Median: robust gegen Ausreißer (einzelne Vielsammler verzerren ihn nicht).
    const median = credits.length === 0
      ? 0
      : credits.length % 2 === 1
        ? credits[(credits.length - 1) / 2]
        : Math.round((credits[credits.length / 2 - 1] + credits[credits.length / 2]) / 2);

    const myIndex = participants.findIndex((p) => p.id === me.id);
    const myRank = myIndex >= 0 ? myIndex + 1 : null;

    return NextResponse.json({
      ok: true,
      participants: participants.length,
      first: first ? { credits: first.creditsTotal, isMe: first.id === me.id } : null,
      me: { rank: myRank, credits: me.creditsTotal },
      median,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "LEADERBOARD_LOAD_FAILED",
        details: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden des Rankings.",
      },
      { status: 500 }
    );
  }
}
