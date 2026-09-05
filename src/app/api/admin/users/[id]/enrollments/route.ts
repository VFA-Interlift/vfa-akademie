import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin(email: string | null | undefined) {
  if (!email) return null;
  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { role: true },
  });
  return me?.role === "ADMIN" ? me : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user.email.trim().toLowerCase() }, select: { role: true } });
  if (!me || me.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: id },
    include: {
      training: { select: { id: true, title: true, code: true, date: true, endDate: true, creditsAward: true } },
      certificate: { select: { id: true, status: true } },
    },
    orderBy: { training: { date: "desc" } },
  });

  return NextResponse.json({
    ok: true,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      attended: e.attended,
      registeredAt: e.registeredAt.toISOString(),
      training: {
        id: e.training.id,
        title: e.training.title,
        code: e.training.code,
        date: e.training.date.toISOString(),
        endDate: e.training.endDate?.toISOString() ?? null,
        creditsAward: e.training.creditsAward,
      },
      // Ein widerrufenes Zertifikat bleibt als Zeile am Enrollment hängen;
      // für die Oberfläche gilt es als nicht vorhanden (Befund f12-2, 05.09.2026).
      hasCertificate: !!e.certificate && e.certificate.status !== "REVOKED",
      certificateId: e.certificate && e.certificate.status !== "REVOKED" ? e.certificate.id : null,
      certificateStatus: e.certificate?.status ?? null,
    })),
  });
}

/**
 * Einen Teilnehmer von Hand in eine Schulung eintragen — der bisher fehlende
 * Weg für telefonische Anmeldungen oder E-Mail-Tippfehler, die keiner der
 * automatischen Wege (Website, Registrierung, Cobra) erreicht.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  const session = await getServerSession(authOptions);
  if (!(await requireAdmin(session?.user?.email))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const trainingId = typeof body.trainingId === "string" ? body.trainingId.trim() : "";
  if (!trainingId) {
    return NextResponse.json({ ok: false, error: "TRAINING_REQUIRED" }, { status: 400 });
  }

  const [user, training] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.training.findUnique({ where: { id: trainingId }, select: { id: true, cancelledAt: true } }),
  ]);
  if (!user) return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  if (!training) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });
  // Eine abgesagte Schulung erzeugt weder Erinnerungen noch Zertifikate —
  // dort niemanden mehr eintragen (Befund f12-24, 05.09.2026).
  if (training.cancelledAt) return NextResponse.json({ ok: false, error: "TRAINING_CANCELLED" }, { status: 409 });

  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId, trainingId, status: "CONFIRMED" },
      include: { training: { select: { title: true, code: true, date: true, endDate: true, creditsAward: true } } },
    });
    return NextResponse.json({ ok: true, enrollmentId: enrollment.id });
  } catch (error) {
    // Schon eingeschrieben (unique userId+trainingId).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, error: "ALREADY_ENROLLED" }, { status: 409 });
    }
    console.error("ADMIN_ENROLL_ERROR", error);
    return NextResponse.json({ ok: false, error: "ENROLL_FAILED" }, { status: 500 });
  }
}
