import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } });
  if (!me || me.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: id },
    include: {
      training: { select: { id: true, title: true, code: true, date: true, endDate: true, creditsAward: true } },
      certificate: { select: { id: true, status: true } },
    },
    orderBy: { training: { date: "desc" } },
  });

  return NextResponse.json({
    ok: true,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      attended: e.attended,
      registeredAt: e.registeredAt.toISOString(),
      training: {
        id: e.training.id,
        title: e.training.title,
        code: e.training.code,
        date: e.training.date.toISOString(),
        endDate: e.training.endDate?.toISOString() ?? null,
        creditsAward: e.training.creditsAward,
      },
      hasCertificate: !!e.certificate,
    })),
  });
}
