import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findAbsentEnrollmentIds } from "@/lib/certificates/attendance";
import { getCertificateTemplateByCode } from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { ok: false as const, response: fail("CRON_SECRET_NOT_CONFIGURED", 500) };
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return { ok: false as const, response: fail("UNAUTHORIZED", 401) };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  const gate = isAuthorized(req);

  if (!gate.ok) {
    return gate.response;
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
              { endDate: { lt: now } },
              { endDate: null, date: { lt: now } },
            ],
          },
        },
        select: {
          id: true,
          userId: true,
          trainingId: true,
          user: { select: { email: true } },
          training: {
            select: {
              title: true,
              code: true,
              certificateKind: true,
              creditsAward: true,
            },
          },
        },
      });

      const absentEnrollmentIds = await findAbsentEnrollmentIds(tx, enrollments);

      let createdCertificates = 0;
      let awardedCredits = 0;
      let skippedNoTemplate = 0;

      for (const enrollment of enrollments) {
        if (absentEnrollmentIds.has(enrollment.id)) {
          continue;
        }

        // Ohne hinterlegte Vorlage entstünde ein Zertifikat, das sich nicht
        // herunterladen lässt — der Teilnehmer klickt und bekommt einen Fehler.
        // Betrifft bewusst YLD und EFK1 (dort zertifiziert erst EFK2) und
        // schützt zugleich vor jeder künftigen Kursart ohne Vorlage.
        if (!getCertificateTemplateByCode(enrollment.training.code)) {
          skippedNoTemplate += 1;
          continue;
        }

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
          select: { id: true },
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
                trainingCode: enrollment.training.code,
                certificateKind: enrollment.training.certificateKind,
              },
            },
          });

          await tx.user.update({
            where: { id: enrollment.userId },
            data: { creditsTotal: { increment: credits } },
          });

          awardedCredits += credits;
        }

        await tx.enrollment.update({
          where: { id: enrollment.id },
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
        skippedAbsent: absentEnrollmentIds.size,
        skippedNoTemplate,
        createdCertificates,
        awardedCredits,
      };
    });

    return NextResponse.json({ ok: true, ...result, triggeredAt: now.toISOString() });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: "CERTIFICATE_GENERATION_FAILED", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
