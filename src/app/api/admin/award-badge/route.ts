import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail.trim().toLowerCase() },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const, admin };
}

/**
 * Legacy-Route:
 * Früher hat diese Route Badge + Credits vergeben.
 *
 * Neuer Ablauf:
 * - erstellt nur noch eine Enrollment / Schulungszuordnung
 * - vergibt keine Credits
 * - erstellt kein Badge
 * - erstellt kein Zertifikat
 *
 * Credits werden später erst bei Zertifikatserstellung vergeben.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => null);

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const trainingId =
    typeof body?.trainingId === "string" ? body.trainingId.trim() : "";

  if (!email) return deny(400, "INVALID_EMAIL");
  if (!trainingId) return deny(400, "INVALID_TRAINING_ID");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const training = await tx.training.findUnique({
        where: { id: trainingId },
        select: {
          id: true,
          title: true,
          date: true,
          endDate: true,
          creditsAward: true,
        },
      });

      if (!training) {
        throw new Error("TRAINING_NOT_FOUND");
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_trainingId: {
            userId: user.id,
            trainingId: training.id,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (existingEnrollment) {
        return {
          already: true,
          enrollmentId: existingEnrollment.id,
          status: existingEnrollment.status,
          userEmail: user.email,
          userName: user.name,
          trainingTitle: training.title,
          trainingDate: training.date,
          creditsAward: training.creditsAward,
        };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          userId: user.id,
          trainingId: training.id,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          status: true,
        },
      });

      return {
        already: false,
        enrollmentId: enrollment.id,
        status: enrollment.status,
        userEmail: user.email,
        userName: user.name,
        trainingTitle: training.title,
        trainingDate: training.date,
        creditsAward: training.creditsAward,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? "UNKNOWN");

    if (msg === "USER_NOT_FOUND") return deny(404, "USER_NOT_FOUND");
    if (msg === "TRAINING_NOT_FOUND") return deny(404, "TRAINING_NOT_FOUND");

    return deny(500, msg);
  }
}