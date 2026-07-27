import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

/**
 * Bestandsaufnahme der App-Datenbank: Woher stammen Schulungen und Teilnehmer,
 * wie viele davon sind zugeordnet, und wie weit reicht die Historie zurück?
 *
 * Beantwortet die Frage, ob Altdaten aus Cobra bereits importiert wurden —
 * die Adminoberfläche zeigt nur Website-Anmeldungen und verschweigt den Rest.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const [
    trainingsGesamt,
    trainingsMitCobraId,
    teilnehmerGesamt,
    teilnehmerOhneSchulung,
    teilnehmerOhneEmail,
    nachTyp,
    enrollmentsNachStatus,
    zertifikate,
    nutzer,
    aeltesteSchulung,
    neuesteSchulung,
  ] = await Promise.all([
    prisma.training.count(),
    prisma.training.count({ where: { cobraId: { not: null } } }),
    prisma.cobraTrainingParticipant.count(),
    prisma.cobraTrainingParticipant.count({ where: { trainingId: null } }),
    prisma.cobraTrainingParticipant.count({ where: { email: null } }),
    prisma.cobraTrainingParticipant.groupBy({
      by: ["participantType"],
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.certificate.count(),
    prisma.user.count(),
    prisma.training.findFirst({
      orderBy: { date: "asc" },
      select: { code: true, title: true, date: true, cobraId: true },
    }),
    prisma.training.findFirst({
      orderBy: { date: "desc" },
      select: { code: true, title: true, date: true, cobraId: true },
    }),
  ]);

  const schulungen = await prisma.training.findMany({
    select: { date: true, cobraId: true },
  });

  const nachJahr: Record<string, { gesamt: number; ausCobra: number }> = {};
  for (const t of schulungen) {
    const jahr = String(t.date.getFullYear());
    nachJahr[jahr] ??= { gesamt: 0, ausCobra: 0 };
    nachJahr[jahr].gesamt += 1;
    if (t.cobraId) nachJahr[jahr].ausCobra += 1;
  }

  return NextResponse.json({
    ok: true,
    schulungen: {
      gesamt: trainingsGesamt,
      mitCobraId: trainingsMitCobraId,
      ohneCobraId: trainingsGesamt - trainingsMitCobraId,
      nachJahr: Object.fromEntries(Object.entries(nachJahr).sort()),
      aelteste: aeltesteSchulung,
      neueste: neuesteSchulung,
    },
    teilnehmer: {
      gesamt: teilnehmerGesamt,
      ohneSchulungszuordnung: teilnehmerOhneSchulung,
      ohneEmail: teilnehmerOhneEmail,
      nachTyp: nachTyp
        .map((row) => ({
          typ: row.participantType ?? "(ohne Typ)",
          anzahl: row._count._all,
        }))
        .sort((a, b) => b.anzahl - a.anzahl),
    },
    anmeldungen: enrollmentsNachStatus
      .map((row) => ({ status: row.status, anzahl: row._count._all }))
      .sort((a, b) => b.anzahl - a.anzahl),
    zertifikate,
    nutzer,
  });
}
