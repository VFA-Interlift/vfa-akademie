import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTrainingCancelledEmail } from "@/lib/email";
import { sendePushAnNutzer } from "@/lib/push";
import { formatDateRange } from "@/lib/trainings/format";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function requireAdminId(email: string | null | undefined) {
  if (!email) return null;
  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, role: true },
  });
  return me?.role === "ADMIN" ? me.id : null;
}

/**
 * Einen Kurs absagen (POST) oder die Absage zurücknehmen (DELETE). Die
 * Anmeldungen bleiben zur Nachschau erhalten; über cancelledAt fällt der Kurs
 * aus den Erinnerungs- und Zertifikatsläufen. Ein hartes Löschen bleibt der
 * bestehenden DELETE-Route auf der Schulung vorbehalten.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!(await requireAdminId(session?.user?.email))) return deny(403, "FORBIDDEN");

  const training = await prisma.training.findUnique({
    where: { id },
    select: { id: true, title: true, code: true, date: true, endDate: true, cancelledAt: true },
  });
  if (!training) return deny(404, "NOT_FOUND");
  if (training.cancelledAt) return deny(409, "ALREADY_CANCELLED");

  await prisma.training.update({
    where: { id },
    data: { cancelledAt: new Date() },
  });

  // Alle aktiv Angemeldeten sofort informieren — per Mail und, wo aktiviert,
  // per Push. Vorher erfuhr niemand von der Absage; der Kurs stand einfach
  // weiter in der App (Ultracode-Befund 13.08.2026). Fehler beim Versand
  // kippen die Absage nicht: Sie ist gesetzt, der Rest ist Bestleistung.
  const angemeldete = await prisma.enrollment.findMany({
    where: { trainingId: id, status: { in: ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"] } },
    select: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, name: true } },
    },
  });

  const kursName = training.code?.trim() || training.title;
  const dateText = formatDateRange(
    training.date.toISOString(),
    training.endDate ? training.endDate.toISOString() : null
  );

  let mails = 0;
  let pushes = 0;
  for (const anmeldung of angemeldete) {
    const u = anmeldung.user;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.name || null;
    if (u.email) {
      try {
        await sendTrainingCancelledEmail({ to: u.email, name, trainingTitle: kursName, dateText });
        mails += 1;
      } catch (fehler) {
        console.error("ABSAGE_MAIL_FEHLER", fehler);
      }
    }
    try {
      pushes += await sendePushAnNutzer(u.id, {
        titel: "Schulung abgesagt",
        text: `${kursName} (${dateText}) findet nicht statt.`,
        url: "/meine-schulungen",
      });
    } catch (fehler) {
      console.error("ABSAGE_PUSH_FEHLER", fehler);
    }
  }

  return NextResponse.json({
    ok: true,
    betroffeneAnmeldungen: angemeldete.length,
    mailsGesendet: mails,
    pushGesendet: pushes,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!(await requireAdminId(session?.user?.email))) return deny(403, "FORBIDDEN");

  await prisma.training.update({
    where: { id },
    data: { cancelledAt: null },
  });
  return NextResponse.json({ ok: true });
}
