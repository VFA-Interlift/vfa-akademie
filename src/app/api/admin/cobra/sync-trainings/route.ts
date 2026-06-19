import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CobraError } from "@/lib/cobra/types";
import { syncCobraTrainings } from "@/lib/cobra/sync-trainings";

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

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const };
}

// Admin: pull trainings from Cobra into the App-DB on demand (same logic as the
// daily cron) so newly added instructors/changes show up in the calendar.
export async function POST() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  try {
    const result = await syncCobraTrainings();

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    if (error instanceof CobraError) {
      return NextResponse.json(
        {
          ok: false,
          error: "COBRA_ERROR",
          message: error.message,
          status: error.status ?? 500,
          details: error.details,
        },
        { status: error.status ?? 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "COBRA_TRAININGS_SYNC_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
