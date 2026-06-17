import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin: match existing users to Cobra participant records by email and create missing enrollments
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email: session.user.email!.toLowerCase() },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  void req;

  const cobraParticipants = await prisma.cobraTrainingParticipant.findMany({
    where: { email: { not: null }, trainingId: { not: null } },
    select: { email: true, trainingId: true },
  });

  let created = 0;
  let skipped = 0;

  for (const p of cobraParticipants) {
    if (!p.email || !p.trainingId) continue;

    const user = await prisma.user.findUnique({
      where: { email: p.email },
      select: { id: true },
    });
    if (!user) { skipped++; continue; }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_trainingId: { userId: user.id, trainingId: p.trainingId } },
      select: { id: true },
    });
    if (existing) { skipped++; continue; }

    await prisma.enrollment.create({
      data: { userId: user.id, trainingId: p.trainingId, status: "CONFIRMED" },
    });
    created++;
  }

  return NextResponse.json({ ok: true, created, skipped });
}
