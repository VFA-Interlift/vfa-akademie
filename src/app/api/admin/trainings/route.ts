import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deutschesDatum } from "@/lib/trainings/format";
import {
  getCertificateKindByCode,
  normalizeCertificateCode,
} from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
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
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    trainings,
  });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const startDateStr = typeof body?.date === "string" ? body.date.trim() : "";
  const endDateStr =
    typeof body?.endDate === "string" ? body.endDate.trim() : "";

  const rawCode = typeof body?.code === "string" ? body.code : "";
  const code = normalizeCertificateCode(rawCode) || null;
  const certificateKind = code ? getCertificateKindByCode(code) : null;

  const location =
    typeof body?.location === "string" && body.location.trim()
      ? body.location.trim()
      : null;

  const instructor =
    typeof body?.instructor === "string" && body.instructor.trim()
      ? body.instructor.trim()
      : null;

  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const creditsAward = Number(body?.creditsAward ?? 0);

  if (!title) return deny(400, "INVALID_TITLE");
  if (!startDateStr) return deny(400, "INVALID_START_DATE");
  if (!endDateStr) return deny(400, "INVALID_END_DATE");

  if (code && !certificateKind) {
    return deny(400, "UNKNOWN_CERTIFICATE_CODE");
  }

  const startDate = deutschesDatum(startDateStr);
  if (!startDate) return deny(400, "INVALID_START_DATE");

  const endDate = deutschesDatum(endDateStr);
  if (!endDate) return deny(400, "INVALID_END_DATE");

  if (endDate.getTime() < startDate.getTime()) {
    return deny(400, "END_DATE_BEFORE_START_DATE");
  }

  if (!Number.isInteger(creditsAward) || creditsAward < 0) {
    return deny(400, "INVALID_CREDITS");
  }

  const training = await prisma.training.create({
    data: {
      title,
      code,
      certificateKind,
      date: startDate,
      endDate,
      location,
      instructor,
      description,
      creditsAward,
    },
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

  return NextResponse.json(
    {
      ok: true,
      training,
    },
    { status: 201 }
  );
}