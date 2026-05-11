import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function ok(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
      role: true,
    },
  });

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: fail("FORBIDDEN", 403) };
  }

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return fail("INVALID_EMAIL", 400);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!existingUser) {
      return fail("USER_NOT_FOUND", 404);
    }

    if (existingUser.role === "ADMIN") {
      return ok({
        email: existingUser.email,
        role: existingUser.role,
        alreadyAdmin: true,
      });
    }

    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        role: "ADMIN",
      },
      select: {
        email: true,
        role: true,
      },
    });

    return ok({
      email: user.email,
      role: user.role,
      alreadyAdmin: false,
    });
  } catch {
    return fail("INTERNAL_ERROR", 500);
  }
}