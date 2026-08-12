import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zertifikateAusstellen } from "@/lib/certificates/ausstellen";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const admin = await prisma.user.findUnique({
    where: {
      email: adminEmail.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const, admin };
}

export async function POST() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const now = new Date();

  try {
    const { empfaenger: _unbenutzt, ...zahlen } = await zertifikateAusstellen(
      now,
      { adminId: gate.admin.id }
    );

    return NextResponse.json({
      ok: true,
      ...zahlen,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "CERTIFICATE_GENERATION_FAILED",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}