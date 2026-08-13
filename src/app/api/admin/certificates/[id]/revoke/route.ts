import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * Ein Zertifikat zurückziehen — der bisher fehlende Rückwärtsgang. Vorher
 * existierte der Status REVOKED nur im Schema, aber kein Weg dorthin, und ein
 * falsch ausgestelltes Zertifikat war nur per Datenbank-Handarbeit zu beheben.
 *
 * In einer Transaktion: Zertifikat auf REVOKED, die dafür gutgeschriebenen
 * Credits zurückbuchen (Gegenbuchung + creditsTotal senken, nie unter 0) und
 * das Enrollment wieder auf einen Zustand ohne Zertifikat setzen.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!adminEmail) return deny(401, "UNAUTHENTICATED");

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail.trim().toLowerCase() },
    select: { id: true, role: true },
  });
  if (!admin || admin.role !== "ADMIN") return deny(403, "FORBIDDEN");

  const body = await req.json().catch(() => ({}));
  const grund =
    typeof body.grund === "string" && body.grund.trim() ? body.grund.trim() : null;
  // Zielstatus des Enrollments nach dem Widerruf. Standard: der Teilnehmer war
  // abwesend (deshalb der Widerruf); der Admin kann auch einen anderen wählen.
  const zielStatus: "NO_SHOW" | "CANCELLED" | "ATTENDED" =
    body.zielStatus === "CANCELLED" || body.zielStatus === "ATTENDED"
      ? body.zielStatus
      : "NO_SHOW";

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      credits: true,
      userId: true,
      enrollmentId: true,
      trainingId: true,
    },
  });
  if (!cert) return deny(404, "CERTIFICATE_NOT_FOUND");
  if (cert.status === "REVOKED") return deny(409, "ALREADY_REVOKED");

  try {
    await prisma.$transaction(async (tx) => {
      // Statuswechsel als Guard IN der Transaktion: Nur wer das Zertifikat
      // wirklich von einem Nicht-REVOKED-Zustand umstellt, bucht auch die
      // Credits zurück. Zwei zeitgleiche Widerrufe buchten sonst doppelt ab
      // (Gegenprüfung 13.08.2026) — der Vorab-Check oben ist nur die schnelle
      // Antwort für den Normalfall.
      const umgestellt = await tx.certificate.updateMany({
        where: { id: cert.id, status: { not: "REVOKED" } },
        data: {
          status: "REVOKED",
          note: grund
            ? `Widerrufen: ${grund}`
            : "Widerrufen durch Administration.",
        },
      });
      if (umgestellt.count === 0) throw new Error("ALREADY_REVOKED");

      // Credits zurückbuchen, sofern welche vergeben wurden.
      if (cert.credits > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: cert.userId,
            amount: -cert.credits,
            type: "ADJUSTMENT",
            reason: "ADMIN_ADJUST",
            trainingId: cert.trainingId,
            // BEWUSST ohne certificateId: Das Feld ist @unique und die
            // AWARD-Buchung der Ausstellung belegt es bereits — mit gesetztem
            // Feld kollidierte jede Gegenbuchung (P2002) und der Widerruf
            // schlug bei Zertifikaten mit Credits IMMER fehl
            // (Ultracode-Befund 13.08.2026). Die Zuordnung steht in meta.
            meta: {
              kind: "CERTIFICATE_REVOKED",
              certificateId: cert.id,
              revokedByAdminId: admin.id,
              grund,
            },
          },
        });

        // creditsTotal nie unter 0 drücken — atomar (decrement plus Klemme),
        // damit kein paralleler Zuwachs zwischen Lesen und Schreiben verloren geht.
        await tx.user.update({
          where: { id: cert.userId },
          data: { creditsTotal: { decrement: cert.credits } },
        });
        await tx.user.updateMany({
          where: { id: cert.userId, creditsTotal: { lt: 0 } },
          data: { creditsTotal: 0 },
        });
      }

      await tx.enrollment.update({
        where: { id: cert.enrollmentId },
        data: {
          status: zielStatus,
          attended: zielStatus === "ATTENDED",
          passed: false,
          completedAt: null,
        },
      });
    });

    return NextResponse.json({ ok: true, creditsZurueck: cert.credits });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REVOKED") {
      return deny(409, "ALREADY_REVOKED");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return deny(404, "CERTIFICATE_NOT_FOUND");
    }
    console.error("CERTIFICATE_REVOKE_ERROR", error);
    return deny(500, "REVOKE_FAILED");
  }
}
