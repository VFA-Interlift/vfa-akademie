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
 * Ein explizites "NICHT_DA" oder "KRANK" zählt als abwesend — beide dürfen kein
 * Zertifikat und keine Gutschrift auslösen. Ist die Anwesenheit gar nicht
 * gepflegt (attendanceStatus = null), bleibt es bei der bisherigen Vergabe:
 * sonst bekäme niemand mehr ein Zertifikat, sobald ein Dozent die Liste nicht
 * führt. Meldet eine andere Zeile derselben Person zur selben Schulung
 * "ANWESEND" (Dublette aus doppelter Website-Anmeldung), gewinnt anwesend.
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

  const statusRows = await tx.cobraTrainingParticipant.findMany({
    where: {
      trainingId: { in: trainingIds },
      attendanceStatus: { in: ["ANWESEND", "NICHT_DA", "KRANK"] },
      NOT: { email: null },
    },
    select: { trainingId: true, email: true, attendanceStatus: true },
  });

  const gepflegte = statusRows.filter(
    (p): p is { trainingId: string; email: string; attendanceStatus: string } =>
      Boolean(p.trainingId && p.email && p.attendanceStatus)
  );
  const keyOf = (p: { trainingId: string; email: string }) =>
    `${p.trainingId}|${p.email.trim().toLowerCase()}`;

  // Doppelte Website-Anmeldungen derselben Person können sich widersprechen:
  // eine Zeile ANWESEND, die Dublette NICHT_DA. Anwesend gewinnt — als abwesend
  // zählt nur, wen KEINE Zeile derselben Schulung als ANWESEND führt. Sonst
  // kostete eine abwesend markierte Dublette den real Anwesenden Zertifikat
  // und Credits (20.08.2026).
  const presentKeys = new Set(
    gepflegte.filter((p) => p.attendanceStatus === "ANWESEND").map(keyOf)
  );
  const absentKeys = new Set(
    gepflegte
      .filter((p) => p.attendanceStatus !== "ANWESEND")
      .map(keyOf)
      .filter((key) => !presentKeys.has(key))
  );

  if (absentKeys.size === 0) {
    return new Set();
  }

  return new Set(
    enrollments
      .filter((e) =>
        absentKeys.has(`${e.trainingId}|${e.user.email.trim().toLowerCase()}`)
      )
      .map((e) => e.id)
  );
}
