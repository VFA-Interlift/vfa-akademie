// Führt die zwei A1-2604-Trainings zusammen (Befund 13.08.2026):
// Der Website-Sync legte den Kurs am 07.07. an (daran hängen Tobis
// Einschreibung und Zertifikat), der Cobra-Sync am 27.07. ein Duplikat
// (cobraId 286, daran 14 Cobra-Teilnehmer). Dieses Skript hängt die
// Cobra-Teilnehmer um, löscht das Duplikat und überträgt die cobraId,
// damit der nächste Cobra-Sync das verbleibende Training aktualisiert
// statt ein neues Duplikat anzulegen.
//
// Aufruf: node scripts/a1-2604-zusammenfuehren.mjs   (im App-Verzeichnis)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BEHALTEN = "cmr9wr23j0000jp04qer1wtqg"; // Website-Training, 07.07., mit Zertifikat
const DUPLIKAT = "cms3a8xk5015wlh04zk2cixlx"; // Cobra-Training, 27.07., cobraId 286

try {
  const duplikat = await prisma.training.findUnique({
    where: { id: DUPLIKAT },
    select: { cobraId: true, code: true },
  });
  if (!duplikat) {
    console.log("Nichts zu tun — das Duplikat ist bereits weg.");
    process.exit(0);
  }

  const [enrollments, zertifikate] = await Promise.all([
    prisma.enrollment.count({ where: { trainingId: DUPLIKAT } }),
    prisma.certificate.count({ where: { trainingId: DUPLIKAT } }),
  ]);
  if (enrollments > 0 || zertifikate > 0) {
    console.error(
      `ABBRUCH: Am Duplikat hängen inzwischen ${enrollments} Einschreibungen / ${zertifikate} Zertifikate — bitte erst prüfen.`
    );
    process.exit(1);
  }

  const ergebnis = await prisma.$transaction(async (tx) => {
    const umgehaengt = await tx.cobraTrainingParticipant.updateMany({
      where: { trainingId: DUPLIKAT },
      data: { trainingId: BEHALTEN },
    });
    await tx.training.delete({ where: { id: DUPLIKAT } });
    await tx.training.update({
      where: { id: BEHALTEN },
      data: { cobraId: duplikat.cobraId },
    });
    return umgehaengt.count;
  });

  console.log(
    `Fertig: ${ergebnis} Cobra-Teilnehmer umgehängt, Duplikat gelöscht, cobraId ${duplikat.cobraId} übertragen.`
  );
} finally {
  await prisma.$disconnect();
}
