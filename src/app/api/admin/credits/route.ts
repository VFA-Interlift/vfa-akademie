import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return deny(401, "UNAUTHENTICATED");
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return deny(403, "FORBIDDEN");
  }

  const body = await req.json().catch(() => null);

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const note =
    typeof body?.note === "string" ? body.note.trim() : null;

  const credits = Number(body?.credits);

  if (!email) return deny(400, "INVALID_EMAIL");
  if (!Number.isInteger(credits) || credits === 0) {
    return deny(400, "INVALID_CREDITS");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, creditsTotal: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const creditTx = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: credits,
          type: "ADJUSTMENT",
          reason: "ADMIN_ADJUST",
          meta: {
            kind: "ADMIN_MANUAL_CREDITS_ONLY",
            adminId: admin.id,
            note: note ?? undefined,
          },
        },
        select: { id: true },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          creditsTotal: {
            increment: credits,
          },
        },
        select: {
          creditsTotal: true,
        },
      });

      return {
        creditTxId: creditTx.id,
        creditsTotal: updatedUser.creditsTotal,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? "UNKNOWN");

    if (msg === "USER_NOT_FOUND") {
      return deny(404, "USER_NOT_FOUND");
    }

    return deny(500, msg);
  }
}