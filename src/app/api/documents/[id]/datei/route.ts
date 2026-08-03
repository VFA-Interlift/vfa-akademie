import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateiAusBlob } from "@/lib/blob-auslieferung";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * Liefert einen selbst hochgeladenen Nachweis aus — nur an den Eigentümer.
 * Ersetzt den direkten Link auf die Blob-Adresse, die ohne Anmeldung
 * erreichbar war.
 */
export async function GET(_req: Request, context: Ctx) {
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
    select: { userId: true, fileUrl: true, filePathname: true, title: true, fileType: true },
  });

  if (!doc) return fail("NOT_FOUND", 404);
  if (doc.userId !== me.id) return fail("FORBIDDEN", 403);

  return dateiAusBlob({
    pathname: doc.filePathname,
    fallbackUrl: doc.fileUrl,
    dateiname: doc.title,
  });
}
