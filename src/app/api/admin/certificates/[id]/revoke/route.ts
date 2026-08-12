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
      await tx.certificate.update({
        where: { id: cert.id },
        data: {
          status: "REVOKED",
          note: grund
            ? `Widerrufen: ${grund}`
            : "Widerrufen durch Administration.",
        },
      });

      // Credits zurückbuchen, sofern welche vergeben wurden.
      if (cert.credits > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: cert.userId,
            amount: -cert.credits,
            type: "ADJUSTMENT",
            reason: "ADMIN_ADJUST",
            trainingId: cert.trainingId,
            certificateId: cert.id,
            meta: {
              kind: "CERTIFICATE_REVOKED",
              revokedByAdminId: admin.id,
              grund,
            },
          },
        });

        // creditsTotal nie unter 0 drücken.
        const user = await tx.user.findUnique({
          where: { id: cert.userId },
          select: { creditsTotal: true },
        });
        const neu = Math.max(0, (user?.creditsTotal ?? 0) - cert.credits);
        await tx.user.update({
          where: { id: cert.userId },
          data: { creditsTotal: neu },
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return deny(404, "CERTIFICATE_NOT_FOUND");
    }
    console.error("CERTIFICATE_REVOKE_ERROR", error);
    return deny(500, "REVOKE_FAILED");
  }
}
