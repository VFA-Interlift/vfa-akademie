import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateiAusBlob } from "@/lib/blob-auslieferung";
import { getInstructorKurscodes } from "@/lib/dozent/zuordnung";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

type Anhang = {
  url?: string;
  pathname?: string;
  filename?: string;
  contentType?: string;
};

/**
 * Liefert einen Anhang aus einer Orga-Mail aus. Anhänge hängen an keiner
 * eigenen Tabelle, sondern als Liste an der Mail — angesprochen wird deshalb
 * über Mail-Kennung und Position: /api/dozent/orga-anhang?mail=<id>&nr=<index>
 *
 * Zugriff wie im Dozentenbereich: Admins immer, Dozenten nur für ihre Kurse.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return fail("UNAUTHENTICATED", 401);

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isInstructor: true, firstName: true, lastName: true, name: true },
  });
  if (!me) return fail("USER_NOT_FOUND", 404);
  if (me.role !== "ADMIN" && !me.isInstructor) return fail("FORBIDDEN", 403);

  const { searchParams } = new URL(req.url);
  const mailId = searchParams.get("mail")?.trim();
  const nr = Number(searchParams.get("nr") ?? "");

  if (!mailId) return fail("MISSING_MAIL", 400);
  if (!Number.isInteger(nr) || nr < 0) return fail("INVALID_INDEX", 400);

  const mail = await prisma.kursOrgaMail.findUnique({
    where: { id: mailId },
    select: { kurscode: true, attachments: true },
  });
  if (!mail) return fail("NOT_FOUND", 404);

  if (me.role !== "ADMIN") {
    let meineKurscodes: Set<string>;
    try {
      meineKurscodes = await getInstructorKurscodes(me);
    } catch {
      return fail("WEBSITE_UNAVAILABLE", 503);
    }
    if (!meineKurscodes.has(mail.kurscode.toUpperCase())) return fail("FORBIDDEN", 403);
  }

  const liste = Array.isArray(mail.attachments) ? (mail.attachments as Anhang[]) : [];
  const anhang = liste[nr];
  if (!anhang) return fail("NOT_FOUND", 404);

  return dateiAusBlob({
    pathname: anhang.pathname,
    fallbackUrl: anhang.url,
    dateiname: anhang.filename,
  });
}
