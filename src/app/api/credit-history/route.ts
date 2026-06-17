import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, creditsTotal: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const txs = await prisma.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      training: { select: { title: true, code: true } },
      certificate: { select: { title: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    creditsTotal: user.creditsTotal,
    transactions: txs.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      reason: tx.reason,
      createdAt: tx.createdAt.toISOString(),
      trainingTitle: tx.training?.code?.trim() || tx.training?.title || null,
      certificateTitle: tx.certificate?.title || null,
      meta: tx.meta,
    })),
  });
}
