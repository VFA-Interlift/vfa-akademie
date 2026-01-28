import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return { ok: false as const, res: deny(200, "NOT_LOGGED_IN") };

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const trainings = await prisma.training.findMany({
    orderBy: { date: "desc" },
    // ✅ updatedAt nur auswählen, wenn die Migration wirklich drauf ist
    select: { id: true, title: true, date: true, creditsAward: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, trainings });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const dateStr = typeof body?.date === "string" ? body.date : "";
  const creditsAward = Number(body?.creditsAward ?? 0);

  if (!title) return deny(400, "INVALID_TITLE");
  if (!dateStr) return deny(400, "INVALID_DATE");
  if (!Number.isInteger(creditsAward) || creditsAward < 0) return deny(400, "INVALID_CREDITS");

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return deny(400, "INVALID_DATE");

  const training = await prisma.training.create({
    data: { title, date, creditsAward },
    select: { id: true, title: true, date: true, creditsAward: true },
  });

  return NextResponse.json({ ok: true, training }, { status: 201 });
}
