import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateiAusBlob } from "@/lib/blob-auslieferung";
import { getInstructorKurscodes } from "@/lib/dozent/zuordnung";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * Liefert eine unterschriebene Teilnehmerliste aus. Auf ihr stehen Klarnamen und
 * eingescannte Unterschriften, deshalb nur für Admins und für Dozenten, deren
 * Kurs sie betrifft — dieselbe Prüfung wie beim Hochladen.
 */
export async function GET(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return fail("UNAUTHENTICATED", 401);

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isInstructor: true, firstName: true, lastName: true, name: true },
  });
  if (!me) return fail("USER_NOT_FOUND", 404);
  if (me.role !== "ADMIN" && !me.isInstructor) return fail("FORBIDDEN", 403);

  const { id } = await context.params;
  const sheet = await prisma.signedParticipantList.findUnique({
    where: { id },
    select: { kurscode: true, fileUrl: true, filePathname: true, uploadedById: true },
  });
  if (!sheet) return fail("NOT_FOUND", 404);

  if (me.role !== "ADMIN" && sheet.uploadedById !== me.id) {
    let meineKurscodes: Set<string>;
    try {
      meineKurscodes = await getInstructorKurscodes(me);
    } catch {
      // Ohne Website-Daten lässt sich die Zuordnung nicht belegen → ablehnen.
      return fail("WEBSITE_UNAVAILABLE", 503);
    }
    if (!meineKurscodes.has(sheet.kurscode.toUpperCase())) return fail("FORBIDDEN", 403);
  }

  return dateiAusBlob({
    pathname: sheet.filePathname,
    fallbackUrl: sheet.fileUrl,
    dateiname: `Teilnehmerliste ${sheet.kurscode}.pdf`,
  });
}
