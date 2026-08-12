import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin: match existing users to Cobra participant records by email and create missing enrollments
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email: session.user.email!.toLowerCase() },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  void req;

  const cobraParticipants = await prisma.cobraTrainingParticipant.findMany({
    where: { email: { not: null }, trainingId: { not: null } },
    select: { email: true, trainingId: true },
  });

  let created = 0;
  let skipped = 0;
  let fehler = 0;

  for (const p of cobraParticipants) {
    if (!p.email || !p.trainingId) continue;

    try {
      // Nur bestätigte Konten: Sonst wäre dies der zweite Weg, an fremde
      // Anmeldungen zu kommen — jemand legt ein Konto auf eine fremde Adresse an
      // und bekommt deren Schulungen beim nächsten Abgleich zugespielt, ohne den
      // Bestätigungslink je geöffnet zu haben.
      // E-Mail kleingeschrieben vergleichen: User.email liegt immer lowercase
      // vor, Alt-Zeilen aus Cobra können Grossschreibung tragen.
      const user = await prisma.user.findUnique({
        where: { email: p.email.trim().toLowerCase() },
        select: { id: true, emailVerifiedAt: true },
      });
      if (!user?.emailVerifiedAt) { skipped++; continue; }

      const existing = await prisma.enrollment.findUnique({
        where: { userId_trainingId: { userId: user.id, trainingId: p.trainingId } },
        select: { id: true },
      });
      if (existing) { skipped++; continue; }

      await prisma.enrollment.create({
        data: { userId: user.id, trainingId: p.trainingId, status: "CONFIRMED" },
      });
      created++;
    } catch (error) {
      // Legt der Wix-Webhook dieselbe Anmeldung parallel an (P2002) oder hakt
      // ein Datensatz, darf das nicht den ganzen Abgleich mit 500 abbrechen und
      // den Zähler verlieren. Diese Zeile überspringen, Rest weiterlaufen.
      console.error("SYNC_ENROLLMENT_ERROR", p.email, p.trainingId, error);
      fehler++;
    }
  }

  return NextResponse.json({ ok: true, created, skipped, fehler });
}
