import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findAbsentEnrollmentIds } from "@/lib/certificates/attendance";
import { istZertifikatErzeugbar } from "@/lib/certificates/pdf";

/**
 * Gemeinsamer Kern der Zertifikatsausstellung — genutzt vom nächtlichen Cron
 * und vom Admin-Knopf. Vorher stand derselbe Code doppelt in beiden Routen.
 *
 * Wichtig gegenüber der alten Fassung (zwei Ultracode-Befunde):
 *
 *  - KEINE grosse Transaktion mehr über alle Teilnehmer. Jeder Teilnehmer
 *    bekommt seine eigene kleine Transaktion. Damit kann ein grosser Schwung
 *    nicht mehr am 5-Sekunden-Standardlimit scheitern und alles zurückrollen.
 *  - Läuft der Admin-Knopf parallel zum Cron, kollidiert der zweite beim
 *    Anlegen am @unique(enrollmentId). Das fangen wir je Teilnehmer ab (P2002)
 *    und überspringen nur diese eine Zeile, statt den ganzen Lauf zu verwerfen.
 */

export type AuszustellenderEmpfaenger = {
  to: string;
  name: string | null;
  trainingTitle: string;
  credits: number;
  certificateKind: string | null;
};

export type AusstellenErgebnis = {
  checkedEnrollments: number;
  skippedAbsent: number;
  skippedNoTemplate: number;
  skippedCollision: number;
  createdCertificates: number;
  awardedCredits: number;
  empfaenger: AuszustellenderEmpfaenger[];
};

export async function zertifikateAusstellen(
  now: Date,
  opts?: { adminId?: string }
): Promise<AusstellenErgebnis> {
  // Grenze ist der BEGINN des heutigen UTC-Tags, nicht der Augenblick: Die
  // Kursdaten stehen als 00:00 UTC des Kalendertags in der Datenbank (der
  // Wix-/Cobra-Sync verwirft Uhrzeiten). Mit `lt: now` stellte der 00:20-Cron
  // Zertifikate samt Credits und "Zertifikat ist da"-Mail bereits in der Nacht
  // ZUM letzten Kurstag aus — Stunden bevor der Kurs lief und bevor ein Dozent
  // Fehlende eintragen konnte (kritischer Ultracode-Befund vom 13.08.2026).
  // Ein Kurs mit Ende am Tag X wird so erst ab dem Folgetag ausgestellt; das
  // gilt bewusst auch für den Admin-Knopf, damit beide Wege dasselbe sagen.
  const tagesbeginn = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  // Lesen läuft ausserhalb jeder Transaktion — nichts wird hier geschrieben.
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
      certificate: null,
      training: {
        // Abgesagte Kurse stellen keine Zertifikate mehr aus.
        cancelledAt: null,
        OR: [
          { endDate: { lt: tagesbeginn } },
          { endDate: null, date: { lt: tagesbeginn } },
        ],
      },
    },
    select: {
      id: true,
      userId: true,
      trainingId: true,
      user: { select: { email: true, firstName: true, lastName: true, name: true } },
      training: {
        select: { title: true, code: true, certificateKind: true, creditsAward: true },
      },
    },
  });

  const absentEnrollmentIds = await findAbsentEnrollmentIds(prisma, enrollments);

  const ergebnis: AusstellenErgebnis = {
    checkedEnrollments: enrollments.length,
    skippedAbsent: absentEnrollmentIds.size,
    skippedNoTemplate: 0,
    skippedCollision: 0,
    createdCertificates: 0,
    awardedCredits: 0,
    empfaenger: [],
  };

  for (const enrollment of enrollments) {
    if (absentEnrollmentIds.has(enrollment.id)) continue;

    // Es genügt nicht, dass eine Vorlage eingetragen ist — sie muss sich auch
    // füllen lassen (Datei vorhanden und Schreibpositionen bekannt). Sonst
    // entstünde ein Zertifikat, dessen Download mit Serverfehler abbricht.
    if (!istZertifikatErzeugbar(enrollment.training.code)) {
      ergebnis.skippedNoTemplate += 1;
      continue;
    }

    const credits = enrollment.training.creditsAward;

    try {
      // Eine kleine Transaktion je Teilnehmer: entweder Zertifikat, Credits und
      // Statuswechsel zusammen — oder für diesen einen nichts.
      await prisma.$transaction(async (tx) => {
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
                ...(opts?.adminId ? { generatedByAdminId: opts.adminId } : {}),
              },
            },
          });

          await tx.user.update({
            where: { id: enrollment.userId },
            data: { creditsTotal: { increment: credits } },
          });
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
      });
    } catch (error) {
      // Kollision am @unique(enrollmentId): der Cron und der Admin-Knopf haben
      // dieselbe Zeile gleichzeitig gegriffen. Nur diese überspringen.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        ergebnis.skippedCollision += 1;
        continue;
      }
      throw error;
    }

    ergebnis.createdCertificates += 1;
    if (credits > 0) ergebnis.awardedCredits += credits;

    if (enrollment.user.email) {
      ergebnis.empfaenger.push({
        to: enrollment.user.email,
        name:
          [enrollment.user.firstName, enrollment.user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          enrollment.user.name ||
          null,
        trainingTitle:
          enrollment.training.code?.trim() || enrollment.training.title,
        credits,
        certificateKind: enrollment.training.certificateKind,
      });
    }
  }

  return ergebnis;
}
