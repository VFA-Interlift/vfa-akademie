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

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return { ok: false as const, res: fail("UNAUTHENTICATED", 401) };
  }

  const me = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: fail("FORBIDDEN", 403) };
  }

  return { ok: true as const, adminUser: me };
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const { id } = await context.params;
  const userId = id?.trim();

  if (!userId) {
    return fail("INVALID_USER_ID", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return fail("USER_NOT_FOUND", 404);
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({
      ok: true,
      alreadyAdmin: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({
    ok: true,
    alreadyAdmin: false,
    user: updatedUser,
  });
}