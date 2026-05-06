import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCertificateKindByCode,
  normalizeCertificateCode,
} from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

function ok(data: any, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

function parseGermanDate(value: string): Date | null {
  const trimmed = value.trim();

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { ok: false as const, res: fail("UNAUTHENTICATED", 401) };
  }

  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const { id: paramId } = await context.params;
  const id = paramId ?? idFromUrl(req);

  if (!id) return fail("MISSING_ID", 400);

  try {
    const body = await req.json().catch(() => null);
    const data: any = {};

    if (typeof body?.title === "string") {
      const title = body.title.trim();
      if (!title) return fail("INVALID_TITLE", 400);
      data.title = title;
    }

    if (body?.code !== undefined) {
      if (typeof body.code !== "string") return fail("INVALID_CODE", 400);

      const code = normalizeCertificateCode(body.code) || null;
      const certificateKind = code ? getCertificateKindByCode(code) : null;

      if (code && !certificateKind) {
        return fail("UNKNOWN_CERTIFICATE_CODE", 400);
      }

      data.code = code;
      data.certificateKind = certificateKind;
    }

    if (body?.date !== undefined) {
      if (typeof body.date !== "string") return fail("INVALID_START_DATE", 400);

      const startDate = parseGermanDate(body.date);
      if (!startDate) return fail("INVALID_START_DATE", 400);

      data.date = startDate;
    }

    if (body?.endDate !== undefined) {
      if (typeof body.endDate !== "string") return fail("INVALID_END_DATE", 400);

      const endDate = parseGermanDate(body.endDate);
      if (!endDate) return fail("INVALID_END_DATE", 400);

      data.endDate = endDate;
    }

    if (body?.location !== undefined) {
      data.location =
        typeof body.location === "string" && body.location.trim()
          ? body.location.trim()
          : null;
    }

    if (body?.instructor !== undefined) {
      data.instructor =
        typeof body.instructor === "string" && body.instructor.trim()
          ? body.instructor.trim()
          : null;
    }

    if (body?.description !== undefined) {
      data.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }

    if (body?.creditsAward !== undefined) {
      const creditsAward = Number(body.creditsAward);
      if (!Number.isInteger(creditsAward) || creditsAward < 0) {
        return fail("INVALID_CREDITS", 400);
      }

      data.creditsAward = creditsAward;
    }

    if (Object.keys(data).length === 0) {
      return fail("NO_CHANGES", 400);
    }

    const existing = await prisma.training.findUnique({
      where: { id },
      select: {
        date: true,
        endDate: true,
      },
    });

    if (!existing) return fail("TRAINING_NOT_FOUND", 404);

    const finalStartDate = data.date ?? existing.date;
    const finalEndDate = data.endDate ?? existing.endDate;

    if (finalEndDate && finalEndDate.getTime() < finalStartDate.getTime()) {
      return fail("END_DATE_BEFORE_START_DATE", 400);
    }

    const training = await prisma.training.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        code: true,
        certificateKind: true,
        date: true,
        endDate: true,
        location: true,
        instructor: true,
        description: true,
        creditsAward: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({ training });
  } catch (e: any) {
    const code = e?.code ? String(e.code) : null;

    if (code === "P2025") {
      return fail("TRAINING_NOT_FOUND", 404);
    }

    return fail("INTERNAL_ERROR", 500, {
      code,
      message: String(e?.message ?? e),
    });
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const { id: paramId } = await context.params;
  const id = paramId ?? idFromUrl(req);

  if (!id) return fail("MISSING_ID", 400);

  try {
    const certificateCount = await prisma.certificate.count({
      where: {
        trainingId: id,
      },
    });

    if (certificateCount > 0) {
      return fail("CERTIFICATES_EXIST", 409);
    }

    await prisma.training.delete({
      where: {
        id,
      },
    });

    return ok({});
  } catch (e: any) {
    const code = e?.code ? String(e.code) : null;

    if (code === "P2025") {
      return fail("TRAINING_NOT_FOUND", 404);
    }

    return fail("INTERNAL_ERROR", 500, {
      code,
      message: String(e?.message ?? e),
    });
  }
}