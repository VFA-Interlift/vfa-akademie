import { NextResponse } from "next/server";
import { dateiKopfzeile } from "@/lib/dateikopf";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Datenauskunft nach Art. 15 DSGVO: alles, was die App über den angemeldeten
 * Nutzer gespeichert hat, als JSON zum Herunterladen.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      gender: true,
      position: true,
      company: true,
      companyStreet: true,
      companyZip: true,
      companyCity: true,
      companyCountry: true,
      role: true,
      isInstructor: true,
      creditsTotal: true,
      leaderboardOptIn: true,
      leaderboardName: true,
      notifyBeforeTraining: true,
      createdAt: true,
      lastLoginAt: true,
      enrollments: {
        select: {
          status: true,
          createdAt: true,
          training: { select: { title: true, code: true, date: true, endDate: true, location: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      certificates: {
        select: { title: true, code: true, credits: true, issuedAt: true, status: true },
        orderBy: { issuedAt: "desc" },
      },
      creditTxs: {
        select: { amount: true, type: true, reason: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        select: { title: true, fileType: true, fileSize: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      trainingFeedbacks: {
        select: { formType: true, overallRating: true, anonymous: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // Teilnehmerzeilen aus Website-Anmeldungen und dem Cobra-Import.
  const teilnahmen = await prisma.cobraTrainingParticipant.findMany({
    where: { email },
    select: {
      caption: true,
      participantType: true,
      status: true,
      attendanceStatus: true,
      company: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const inhalt = JSON.stringify(
    { erstelltAm: new Date().toISOString(), profil: user, teilnahmen },
    null,
    2
  );

  return new NextResponse(inhalt, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": dateiKopfzeile("vfa-akademie-meine-daten.json", false),
      "Cache-Control": "no-store",
    },
  });
}
