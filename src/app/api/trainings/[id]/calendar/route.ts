import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTrainingIcs, icsFileName } from "@/lib/trainings/ics";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape);
}

export async function GET(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return fail("UNAUTHENTICATED", 401);
  }

  const { id } = await context.params;
  if (!id) return fail("MISSING_TRAINING_ID", 400);

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) return fail("USER_NOT_FOUND", 404);

  // Nur eigene gebuchte Schulungen (oder Admin) dürfen exportiert werden.
  if (me.role !== "ADMIN") {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_trainingId: { userId: me.id, trainingId: id } },
      select: { id: true },
    });
    if (!enrollment) return fail("FORBIDDEN", 403);
  }

  const training = await prisma.training.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      code: true,
      date: true,
      endDate: true,
      location: true,
      instructor: true,
      description: true,
      creditsAward: true,
    },
  });

  if (!training) return fail("TRAINING_NOT_FOUND", 404);

  const ics = buildTrainingIcs(training);
  const fileName = icsFileName(training);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
