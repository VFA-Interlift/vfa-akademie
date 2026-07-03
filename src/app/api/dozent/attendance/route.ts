import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["ANWESEND", "NICHT_DA", "KRANK"] as const;

/**
 * Dozenten pflegen die Anwesenheit der Website-Teilnehmer ihrer Schulung.
 * status null = zurück auf „offen".
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { isInstructor: true },
  });
  if (!me?.isInstructor) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { participantId?: unknown; status?: unknown } | null;
  const participantId = typeof body?.participantId === "string" ? body.participantId : null;
  const status = body?.status === null ? null : typeof body?.status === "string" ? body.status : undefined;

  if (!participantId) return NextResponse.json({ ok: false, error: "MISSING_PARTICIPANT" }, { status: 400 });
  if (status !== null && !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  try {
    const updated = await prisma.cobraTrainingParticipant.update({
      where: { id: participantId },
      data: { attendanceStatus: status },
      select: { id: true, attendanceStatus: true },
    });
    return NextResponse.json({ ok: true, participant: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "PARTICIPANT_NOT_FOUND" }, { status: 404 });
  }
}
