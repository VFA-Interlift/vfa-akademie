import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

function startOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return fail("CRON_SECRET_NOT_CONFIGURED", 500);
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return fail("UNAUTHORIZED", 401);
  }

  const todayUtc = startOfTodayUtc();

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
                  lt: todayUtc,
                },
              },
              {
                endDate: null,
                date: {
                  lt: todayUtc,
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
              date: true,
              endDate: true,
              location: true,
              instructor: true,
              description: true,
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
                kind: "AUTO_CERTIFICATE_CREDITS",
                enrollmentId: enrollment.id,
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
            completedAt: new Date(),
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
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "CERTIFICATE_CRON_FAILED",
        details: String(error?.message ?? error),
      },
      { status: 500 }
    );
  }
}