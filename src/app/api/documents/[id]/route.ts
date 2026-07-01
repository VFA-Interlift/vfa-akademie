import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function DELETE(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return fail("UNAUTHENTICATED", 401);

  const me = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!me) return fail("USER_NOT_FOUND", 404);

  const { id } = await context.params;
  const doc = await prisma.userDocument.findUnique({
    where: { id },
    select: { userId: true, fileUrl: true },
  });

  if (!doc) return fail("NOT_FOUND", 404);
  if (doc.userId !== me.id) return fail("FORBIDDEN", 403);

  // Datei aus Blob entfernen (Fehler hier nicht fatal – DB-Eintrag trotzdem löschen).
  try {
    await del(doc.fileUrl);
  } catch {
    /* ignore blob delete errors */
  }

  await prisma.userDocument.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
