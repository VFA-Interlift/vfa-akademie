import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getDisplayName(user: {
  leaderboardName: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
}) {
  const customName = user.leaderboardName?.trim();

  if (customName) {
    return customName;
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        leaderboardOptIn: true,
        creditsTotal: {
          gt: 0,
        },
      },
      orderBy: [
        {
          creditsTotal: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        leaderboardName: true,
        creditsTotal: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        displayName: getDisplayName(user),
        creditsTotal: user.creditsTotal,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "LEADERBOARD_LOAD_FAILED",
        details:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Laden des Leaderboards.",
      },
      { status: 500 }
    );
  }
}