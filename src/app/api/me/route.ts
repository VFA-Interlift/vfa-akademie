import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, loggedIn: false }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      creditsTotal: true,
      role: true,
    },
  });

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    email: user?.email,
    name: user?.name ?? null,
    creditsTotal: user?.creditsTotal ?? 0,
    role: user?.role ?? "USER",
  });
}
