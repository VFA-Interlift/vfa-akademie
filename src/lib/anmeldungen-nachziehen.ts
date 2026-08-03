import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Verbindet ein Konto mit den Kursanmeldungen, die unter derselben
 * E-Mail-Adresse aus Website und Verbandsverwaltung vorliegen.
 *
 * Läuft bewusst erst nach bestätigter Adresse: Vorher genügte die Kenntnis
 * einer fremden Adresse, um deren Schulungen, Zertifikate und Credits zu erben.
 *
 * Status CONFIRMED, nicht PENDING — der Zertifikatslauf verarbeitet nur
 * CONFIRMED, ATTENDED und COMPLETED.
 */
export async function anmeldungenNachziehen(userId: string, email: string) {
  const adresse = email.trim().toLowerCase();
  if (!adresse) return 0;

  const treffer = await prisma.cobraTrainingParticipant.findMany({
    where: { email: adresse, trainingId: { not: null } },
    select: { trainingId: true },
  });

  let uebernommen = 0;

  for (const eintrag of treffer) {
    if (!eintrag.trainingId) continue;

    await prisma.enrollment.upsert({
      where: { userId_trainingId: { userId, trainingId: eintrag.trainingId } },
      create: { userId, trainingId: eintrag.trainingId, status: "CONFIRMED" },
      update: {},
    });

    uebernommen += 1;
  }

  return uebernommen;
}
