import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Alle Status, die das Schema kennt — auch CERTIFICATE_ISSUED und COMPLETED,
// damit ein versehentlich verstellter Status wieder zurückgesetzt werden kann.
const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "ATTENDED",
  "CANCELLED",
  "NO_SHOW",
  "CERTIFICATE_ISSUED",
  "COMPLETED",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { role: true },
  });
  if (!me || me.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    select: { certificate: { select: { id: true, status: true } } },
  });
  if (!enrollment) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  // Ein storniertes/abwesendes Enrollment, das schon ein Zertifikat trägt, ist
  // ein Widerspruch. Der Rückbau (Zertifikat widerrufen + Credits zurück) läuft
  // über den eigenen Widerruf-Weg — hier weisen wir darauf hin, statt still ein
  // Zertifikat einer nicht besuchten Schulung stehen zu lassen. Ein bereits
  // widerrufenes Zertifikat bleibt als Zeile hängen und zählt hier nicht
  // (Befund f12-1, 05.09.2026).
  if (
    enrollment.certificate &&
    enrollment.certificate.status !== "REVOKED" &&
    (status === "CANCELLED" || status === "NO_SHOW")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "CERTIFICATE_EXISTS",
        message:
          "Zu dieser Anmeldung ist bereits ein Zertifikat ausgestellt. Ziehe es " +
          "erst zurück (Zertifikat widerrufen), danach lässt sich der Status ändern.",
      },
      { status: 409 }
    );
  }

  try {
    const updated = await prisma.enrollment.update({
      where: { id },
      // attended bleibt bei COMPLETED/CERTIFICATE_ISSUED wahr — der
      // Zertifikatslauf schreibt diese Status selbst mit attended: true
      // (Befund f06-13, 05.09.2026).
      data: {
        status,
        attended: status === "ATTENDED" || status === "COMPLETED" || status === "CERTIFICATE_ISSUED",
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, name: true } },
        training: { select: { title: true, code: true } },
      },
    });
    return NextResponse.json({ ok: true, enrollment: updated });
  } catch (error) {
    // Zwischen findUnique und update gelöscht → sauberer 404 statt 500.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    throw error;
  }
}
