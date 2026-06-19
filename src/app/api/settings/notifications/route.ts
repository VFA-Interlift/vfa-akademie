import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUserEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email?.trim().toLowerCase() ?? null;
}

export async function GET() {
  const email = await getUserEmail();

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { notifyBeforeTraining: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, notifyBeforeTraining: user.notifyBeforeTraining });
}

export async function POST(req: Request) {
  const email = await getUserEmail();

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (typeof body?.notifyBeforeTraining !== "boolean") {
    return NextResponse.json({ ok: false, error: "INVALID_VALUE" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { notifyBeforeTraining: body.notifyBeforeTraining },
  });

  return NextResponse.json({ ok: true, notifyBeforeTraining: body.notifyBeforeTraining });
}
