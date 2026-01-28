import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  // ✅ Session prüfen
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return deny(401, "UNAUTHENTICATED");
  }

  // ✅ Admin in DB laden (für role + id)
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return deny(403, "FORBIDDEN");
  }

  // ✅ Body lesen
  const body = await req.json().catch(() => null);

  const email =
    typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const trainingId =
    typeof body?.trainingId === "string"
      ? body.trainingId
      : "";

  const note =
    typeof body?.note === "string"
      ? body.note.trim()
      : null;

  if (!email) return deny(400, "INVALID_EMAIL");
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  // ✅ credits optional: leer => Training.creditsAward
  let credits: number;

  if (body?.credits === undefined || body?.credits === null || body?.credits === "") {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      select: { creditsAward: true },
    });
    if (!training) return deny(404, "TRAINING_NOT_FOUND");
    credits = training.creditsAward;
  } else {
    credits = Number(body.credits);
  }

  if (!Number.isInteger(credits) || credits < 0) {
    return deny(400, "INVALID_CREDITS");
  }

  // ✅ Transaction: Badge + CreditTx + creditsTotal
  try {
    const result = await prisma.$transaction(async (tx) => {
      // User finden
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");

      // Doppelt verhindern
      const existingBadge = await tx.badge.findUnique({
        where: {
          userId_trainingId: { userId: user.id, trainingId },
        },
        select: { id: true },
      });
      if (existingBadge) throw new Error("BADGE_ALREADY_EXISTS");

      // Badge erstellen
      const badge = await tx.badge.create({
        data: {
          userId: user.id,
          trainingId,
          issuedById: admin.id,
          note: note ?? undefined,
        },
        select: { id: true },
      });

      // Ledger (CreditTransaction)
      const creditTx = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: credits,
          type: "ADJUSTMENT",
          reason: "ADMIN_ADJUST",
          trainingId,
          badgeId: badge.id,
          meta: {
            kind: "ADMIN_MANUAL_CERT_AWARD",
            adminId: admin.id,
            note: note ?? undefined,
          },
        },
        select: { id: true },
      });

      // creditsTotal hochzählen
      await tx.user.update({
        where: { id: user.id },
        data: { creditsTotal: { increment: credits } },
      });

      return { badgeId: badge.id, creditTxId: creditTx.id };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    const msg = String(e?.message ?? "UNKNOWN");
    if (msg === "USER_NOT_FOUND") return deny(404, msg);
    if (msg === "BADGE_ALREADY_EXISTS") return deny(409, msg);
    return deny(400, msg);
  }
}
