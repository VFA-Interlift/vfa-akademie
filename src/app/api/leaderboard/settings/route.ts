import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status }
  );
}

function cleanLeaderboardName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 60);
}

async function getCurrentUserEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  return email || null;
}

export async function GET() {
  const email = await getCurrentUserEmail();

  if (!email) {
    return fail("UNAUTHENTICATED", 401);
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      leaderboardOptIn: true,
      leaderboardName: true,
    },
  });

  if (!user) {
    return fail("USER_NOT_FOUND", 404);
  }

  const defaultName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name ||
    user.email;

  return NextResponse.json({
    ok: true,
    settings: {
      leaderboardOptIn: user.leaderboardOptIn,
      leaderboardName: user.leaderboardName ?? "",
      suggestedName: defaultName,
    },
  });
}

export async function PUT(req: Request) {
  const email = await getCurrentUserEmail();

  if (!email) {
    return fail("UNAUTHENTICATED", 401);
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return fail("INVALID_JSON", 400);
  }

  const leaderboardOptIn = Boolean(
    "leaderboardOptIn" in body ? body.leaderboardOptIn : false
  );

  const leaderboardName = cleanLeaderboardName(
    "leaderboardName" in body ? body.leaderboardName : ""
  );

  if (leaderboardOptIn && !leaderboardName) {
    return fail("LEADERBOARD_NAME_REQUIRED", 400);
  }

  const updatedUser = await prisma.user.update({
    where: {
      email,
    },
    data: {
      leaderboardOptIn,
      leaderboardName: leaderboardOptIn ? leaderboardName : null,
    },
    select: {
      leaderboardOptIn: true,
      leaderboardName: true,
    },
  });

  return NextResponse.json({
    ok: true,
    settings: {
      leaderboardOptIn: updatedUser.leaderboardOptIn,
      leaderboardName: updatedUser.leaderboardName ?? "",
    },
  });
}