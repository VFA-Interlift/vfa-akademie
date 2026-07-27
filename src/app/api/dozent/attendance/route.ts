import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstructorKurscodes, participantKurscode } from "@/lib/dozent/zuordnung";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["ANWESEND", "NICHT_DA", "KRANK"] as const;

/**
 * Dozenten pflegen die Anwesenheit der Website-Teilnehmer ihrer Schulung.
 * status null = zurück auf „offen".
 *
 * Die Anwesenheit steuert seit dem Zertifikatslauf, ob jemand ein Zertifikat
 * und Credits bekommt — deshalb wird geprüft, ob der Teilnehmer zu einem Kurs
 * dieses Dozenten gehört, nicht nur ob der Nutzer überhaupt Dozent ist.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { isInstructor: true, role: true, firstName: true, lastName: true, name: true },
  });
  if (!me?.isInstructor && me?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { participantId?: unknown; status?: unknown } | null;
  const participantId = typeof body?.participantId === "string" ? body.participantId : null;
  const status = body?.status === null ? null : typeof body?.status === "string" ? body.status : undefined;

  if (!participantId) return NextResponse.json({ ok: false, error: "MISSING_PARTICIPANT" }, { status: 400 });
  if (status !== null && !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  const participant = await prisma.cobraTrainingParticipant.findUnique({
    where: { id: participantId },
    select: { id: true, raw: true },
  });
  if (!participant) {
    return NextResponse.json({ ok: false, error: "PARTICIPANT_NOT_FOUND" }, { status: 404 });
  }

  if (me.role !== "ADMIN") {
    const kurscode = participantKurscode(participant.raw);

    let meineKurscodes: Set<string>;
    try {
      meineKurscodes = await getInstructorKurscodes(me);
    } catch {
      // Ohne Website-Daten lässt sich die Zuordnung nicht belegen → ablehnen.
      return NextResponse.json({ ok: false, error: "WEBSITE_UNAVAILABLE" }, { status: 503 });
    }

    if (!kurscode || !meineKurscodes.has(kurscode)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const updated = await prisma.cobraTrainingParticipant.update({
    where: { id: participant.id },
    data: { attendanceStatus: status },
    select: { id: true, attendanceStatus: true },
  });

  return NextResponse.json({ ok: true, participant: updated });
}
