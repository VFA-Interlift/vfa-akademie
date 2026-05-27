import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const admin = await prisma.user.findUnique({
    where: {
      email: adminEmail.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const, admin };
}

export async function POST() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const enrollments = await tx.enrollment.findMany({
        where: {
          status: {
            in: ["CONFIRMED", "ATTENDED", "COMPLETED"],
          },
          certificate: null,
          training: {
            OR: [
              {
                endDate: {
                  lt: now,
                },
              },
              {
                endDate: null,
                date: {
                  lt: now,
                },
              },
            ],
          },
        },
        select: {
          id: true,
          userId: true,
          trainingId: true,
          training: {
            select: {
              id: true,
              title: true,
              code: true,
              certificateKind: true,
              date: true,
              endDate: true,
              creditsAward: true,
            },
          },
        },
      });

      let createdCertificates = 0;
      let awardedCredits = 0;

      for (const enrollment of enrollments) {
        const credits = enrollment.training.creditsAward;

        const certificate = await tx.certificate.create({
          data: {
            userId: enrollment.userId,
            trainingId: enrollment.trainingId,
            enrollmentId: enrollment.id,
            title: enrollment.training.title,
            credits,
            code: enrollment.training.code,
            certificateKind: enrollment.training.certificateKind,
            note: "Automatisch nach Schulungsabschluss erstellt.",
          },
          select: {
            id: true,
          },
        });

        if (credits > 0) {
          await tx.creditTransaction.create({
            data: {
              userId: enrollment.userId,
              amount: credits,
              type: "AWARD",
              reason: "CERTIFICATE_ISSUED",
              trainingId: enrollment.trainingId,
              certificateId: certificate.id,
              meta: {
                kind: "CERTIFICATE_AUTO_CREDITS",
                enrollmentId: enrollment.id,
                generatedByAdminId: gate.admin.id,
                trainingCode: enrollment.training.code,
                certificateKind: enrollment.training.certificateKind,
              },
            },
          });

          await tx.user.update({
            where: {
              id: enrollment.userId,
            },
            data: {
              creditsTotal: {
                increment: credits,
              },
            },
          });

          awardedCredits += credits;
        }

        await tx.enrollment.update({
          where: {
            id: enrollment.id,
          },
          data: {
            status: "CERTIFICATE_ISSUED",
            attended: true,
            passed: true,
            completedAt: now,
          },
        });

        createdCertificates += 1;
      }

      return {
        checkedEnrollments: enrollments.length,
        createdCertificates,
        awardedCredits,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "CERTIFICATE_GENERATION_FAILED",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}