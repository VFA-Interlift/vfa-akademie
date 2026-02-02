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
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!adminEmail) return deny(401, "UNAUTHENTICATED");

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") return deny(403, "FORBIDDEN");

  const trainingId = params?.id;
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  // Training exists?
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true },
  });
  if (!training) return deny(404, "TRAINING_NOT_FOUND");

  // Block deletion if any badges exist (assigned participants)
  const badgeCount = await prisma.badge.count({
    where: { trainingId },
  });
  if (badgeCount > 0) return deny(409, "TRAINING_HAS_BADGES");

  // Block deletion if any credit transactions reference this training
  // (e.g. manual credits/debits with trainingId)
  const creditTxCount = await prisma.creditTransaction.count({
    where: { trainingId },
  });
  if (creditTxCount > 0) return deny(409, "TRAINING_HAS_CREDIT_TX");

  // Delete related tokens first (if relation exists) then training
  await prisma.$transaction(async (tx) => {
    // if you have a "Token" model linked to trainingId:
    await tx.token.deleteMany({ where: { trainingId } }).catch(() => null);

    // some schemas name it "TrainingToken" instead of "Token"
    await tx.trainingToken
      .deleteMany({ where: { trainingId } })
      .catch(() => null);

    await tx.training.delete({ where: { id: trainingId } });
  });

  return NextResponse.json({ ok: true });
}
