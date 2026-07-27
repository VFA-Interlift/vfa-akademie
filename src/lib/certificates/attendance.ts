import type { Prisma } from "@prisma/client";

export type EnrollmentForAttendance = {
  id: string;
  trainingId: string;
  user: { email: string };
};

/**
 * Ermittelt die Enrollments, deren Teilnehmer vom Dozenten ausdrücklich als
 * abwesend markiert wurde — für sie darf kein Zertifikat und keine Gutschrift
 * entstehen.
 *
 * Nur ein explizites "NICHT_DA" zählt. Ist die Anwesenheit gar nicht gepflegt
 * (attendanceStatus = null), bleibt es bei der bisherigen Vergabe: sonst
 * bekäme niemand mehr ein Zertifikat, sobald ein Dozent die Liste nicht führt.
 *
 * Die Zuordnung läuft über Schulung + E-Mail, weil die Teilnehmerzeilen aus
 * der Website-Anmeldung stammen und keinen direkten Bezug zum Enrollment haben.
 */
export async function findAbsentEnrollmentIds(
  tx: Prisma.TransactionClient,
  enrollments: EnrollmentForAttendance[]
): Promise<Set<string>> {
  if (enrollments.length === 0) {
    return new Set();
  }

  const trainingIds = [...new Set(enrollments.map((e) => e.trainingId))];

  const absentParticipants = await tx.cobraTrainingParticipant.findMany({
    where: {
      trainingId: { in: trainingIds },
      attendanceStatus: "NICHT_DA",
      NOT: { email: null },
    },
    select: { trainingId: true, email: true },
  });

  const absentKeys = new Set(
    absentParticipants
      .filter((p): p is { trainingId: string; email: string } =>
        Boolean(p.trainingId && p.email)
      )
      .map((p) => `${p.trainingId}|${p.email.toLowerCase()}`)
  );

  if (absentKeys.size === 0) {
    return new Set();
  }

  return new Set(
    enrollments
      .filter((e) =>
        absentKeys.has(`${e.trainingId}|${e.user.email.toLowerCase()}`)
      )
      .map((e) => e.id)
  );
}
