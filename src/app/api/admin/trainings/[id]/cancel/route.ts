import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireAdminId(email: string | null | undefined) {
  if (!email) return null;
  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, role: true },
  });
  return me?.role === "ADMIN" ? me.id : null;
}

/**
 * Einen Kurs absagen (POST) oder die Absage zurücknehmen (DELETE). Die
 * Anmeldungen bleiben zur Nachschau erhalten; über cancelledAt fällt der Kurs
 * aus den Erinnerungs- und Zertifikatsläufen. Ein hartes Löschen bleibt der
 * bestehenden DELETE-Route auf der Schulung vorbehalten.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!(await requireAdminId(session?.user?.email))) return deny(403, "FORBIDDEN");

  const training = await prisma.training.findUnique({
    where: { id },
    select: { id: true, cancelledAt: true },
  });
  if (!training) return deny(404, "NOT_FOUND");
  if (training.cancelledAt) return deny(409, "ALREADY_CANCELLED");

  await prisma.training.update({
    where: { id },
    data: { cancelledAt: new Date() },
  });

  const betroffene = await prisma.enrollment.count({ where: { trainingId: id } });
  return NextResponse.json({ ok: true, betroffeneAnmeldungen: betroffene });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!(await requireAdminId(session?.user?.email))) return deny(403, "FORBIDDEN");

  await prisma.training.update({
    where: { id },
    data: { cancelledAt: null },
  });
  return NextResponse.json({ ok: true });
}
