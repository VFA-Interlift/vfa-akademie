import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function ok(data: any, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}
function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ok: false as const, res: fail("UNAUTHENTICATED", 401) };

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") return { ok: false as const, res: fail("FORBIDDEN", 403) };

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return fail("MISSING_EMAIL", 400);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { email: true, role: true },
    });

    return ok({ email: user.email, role: user.role });
  } catch (e: any) {
    const code = e?.code ? String(e.code) : null;
    if (code === "P2025") return fail("USER_NOT_FOUND", 404);
    return fail("INTERNAL_ERROR", 500, { code, message: String(e?.message ?? e) });
  }
}
