import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // ✅ Session prüfen
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!adminEmail) return deny(401, "UNAUTHENTICATED");

  // ✅ Admin prüfen
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return deny(403, "FORBIDDEN");
  }

  const trainingId = params.id;
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  // ✅ Training existiert?
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true },
  });

  if (!training) return deny(404, "TRAINING_NOT_FOUND");

  // ✅ Blockieren wenn schon Teilnehmer zugeordnet sind
  const badgeCount = await prisma.badge.count({
    where: { trainingId },
  });

  if (badgeCount > 0) {
    return deny(409, "TRAINING_HAS_BADGES");
  }

  // ✅ Blockieren wenn CreditTransactions existieren
  const creditTxCount = await prisma.creditTransaction.count({
    where: { trainingId },
  });

  if (creditTxCount > 0) {
    return deny(409, "TRAINING_HAS_CREDIT_TX");
  }

  // ✅ Safe Delete
  await prisma.training.delete({
    where: { id: trainingId },
  });

  return NextResponse.json({ ok: true });
}
