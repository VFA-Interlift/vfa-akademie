import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } });
  if (!me || me.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const updated = await prisma.enrollment.update({
    where: { id },
    data: { status, attended: status === "ATTENDED" },
    include: {
      user: { select: { email: true, firstName: true, lastName: true, name: true } },
      training: { select: { title: true, code: true } },
    },
  });

  return NextResponse.json({ ok: true, enrollment: updated });
}
