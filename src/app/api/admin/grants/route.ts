import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * POST:
 * - credits > 0 => Badge erstellen + Ledger + creditsTotal
 * - credits < 0 => nur Ledger + creditsTotal (kein Badge)
 */
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
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const trainingId =
    typeof body?.trainingId === "string" ? body.trainingId : "";

  const note =
    typeof body?.note === "string" ? body.note.trim() : null;

  if (!email) return deny(400, "INVALID_EMAIL");
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  // ✅ credits optional: leer => Training.creditsAward
  // ✅ ABER: negatives Abziehen nur, wenn explizit gesetzt (nicht via default)
  let credits: number;

  const creditsProvided =
    !(body?.credits === undefined || body?.credits === null || body?.credits === "");

  if (!creditsProvided) {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      select: { creditsAward: true },
    });
    if (!training) return deny(404, "TRAINING_NOT_FOUND");
    credits = training.creditsAward; // default ist i.d.R. positiv
  } else {
    credits = Number(body.credits);
  }

  // ✅ Validierung: integer, nicht 0
  if (!Number.isInteger(credits) || credits === 0) {
    return deny(400, "INVALID_CREDITS");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // User finden
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");

      // =========================
      // CASE 1: Credits abziehen (negativ)
      // -> KEIN Badge, nur Ledger + creditsTotal
      // =========================
      if (credits < 0) {
        const creditTx = await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: credits, // negativ
            type: "ADJUSTMENT",
            reason: "ADMIN_ADJUST",
            trainingId, // optionaler Kontext
            meta: {
              kind: "ADMIN_MANUAL_CREDIT_DEBIT",
              adminId: admin.id,
              note: note ?? undefined,
            },
          },
          select: { id: true },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { creditsTotal: { increment: credits } }, // increment mit negativ = abziehen
        });

        return { badgeId: null, creditTxId: creditTx.id };
      }

      // =========================
      // CASE 2: Credits vergeben (positiv)
      // -> Badge + Ledger + creditsTotal
      // =========================

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
          amount: credits, // positiv
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

/**
 * DELETE:
 * - entfernt ein vorhandenes Badge (userId + trainingId)
 * - bucht die ursprünglich vergebenen Credits wieder zurück (negativer Ledger Eintrag)
 * - reduziert creditsTotal entsprechend
 */
export async function DELETE(req: Request) {
  // ✅ Session prüfen
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) return deny(401, "UNAUTHENTICATED");

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

  const trainingId =
    typeof body?.trainingId === "string" ? body.trainingId : "";

  const note =
    typeof body?.note === "string" ? body.note.trim() : null;

  if (!email) return deny(400, "INVALID_EMAIL");
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) throw new Error("USER_NOT_FOUND");

      // Badge finden
      const badge = await tx.badge.findUnique({
        where: { userId_trainingId: { userId: user.id, trainingId } },
        select: { id: true },
      });
      if (!badge) throw new Error("BADGE_NOT_FOUND");

      // Award-CreditTx finden: die, die beim Vergeben auf badgeId gesetzt wurde
      const awardTx = await tx.creditTransaction.findFirst({
        where: { badgeId: badge.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true },
      });
      if (!awardTx) throw new Error("AWARD_TX_NOT_FOUND");

      const creditsToRevert = awardTx.amount;

      // Sicherheitscheck
      if (!Number.isInteger(creditsToRevert) || creditsToRevert <= 0) {
        throw new Error("INVALID_AWARD_AMOUNT");
      }

      // 1) Badge löschen
      await tx.badge.delete({
        where: { id: badge.id },
      });

      // 2) Reversal-Ledger schreiben (negativ)
      const reversalTx = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -creditsToRevert,
          type: "ADJUSTMENT",
          reason: "ADMIN_ADJUST",
          trainingId,
          badgeId: null,
          meta: {
            kind: "ADMIN_REVOKE_CERT",
            adminId: admin.id,
            revokedBadgeId: badge.id,
            originalCreditTxId: awardTx.id,
            note: note ?? undefined,
          },
        },
        select: { id: true },
      });

      // 3) creditsTotal runter
      await tx.user.update({
        where: { id: user.id },
        data: { creditsTotal: { increment: -creditsToRevert } },
      });

      return { revokedBadgeId: badge.id, reversalTxId: reversalTx.id };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    const msg = String(e?.message ?? "UNKNOWN");
    if (msg === "USER_NOT_FOUND") return deny(404, msg);
    if (msg === "BADGE_NOT_FOUND") return deny(404, msg);
    if (msg === "AWARD_TX_NOT_FOUND") return deny(409, msg);
    return deny(400, msg);
  }
}
