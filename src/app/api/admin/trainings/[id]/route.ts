import { NextResponse } from "next/server";
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

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: fail("FORBIDDEN", 403) };
  }

  return { ok: true as const };
}

function idFromUrl(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
}

function resolveId(req: Request, params?: { id?: string }) {
  return params?.id ?? idFromUrl(req);
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const id = resolveId(req, context?.params);
  if (!id) return fail("MISSING_ID", 400);

  try {
    const body = await req.json().catch(() => null);
    const data: any = {};

    if (body?.creditsAward !== undefined) {
      const c = Number(body.creditsAward);
      if (!Number.isInteger(c) || c < 0) return fail("INVALID_CREDITS", 400);
      data.creditsAward = c;
    }

    if (typeof body?.title === "string") {
      const title = body.title.trim();
      if (!title) return fail("INVALID_TITLE", 400);
      data.title = title;
    }

    if (body?.date !== undefined) {
      if (typeof body.date !== "string") return fail("INVALID_DATE", 400);
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) return fail("INVALID_DATE", 400);
      data.date = d;
    }

    if (Object.keys(data).length === 0) return fail("NO_CHANGES", 400);

    const training = await prisma.training.update({
      where: { id },
      data,
      select: { id: true, title: true, date: true, creditsAward: true },
    });

    return ok({ training });
  } catch (e: any) {
    const code = e?.code ? String(e.code) : null;
    if (code === "P2025") return fail("TRAINING_NOT_FOUND", 404);
    return fail("INTERNAL_ERROR", 500, { code, message: String(e?.message ?? e) });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const id = resolveId(req, context?.params);
  if (!id) return fail("MISSING_ID", 400);

  try {
    const badgeCount = await prisma.badge.count({ where: { trainingId: id } });
    if (badgeCount > 0) return fail("TRAINING_HAS_BADGES", 409);

    await prisma.training.delete({ where: { id } });
    return ok({});
  } catch (e: any) {
    const code = e?.code ? String(e.code) : null;
    if (code === "P2025") return fail("TRAINING_NOT_FOUND", 404);
    return fail("INTERNAL_ERROR", 500, { code, message: String(e?.message ?? e) });
  }
}
