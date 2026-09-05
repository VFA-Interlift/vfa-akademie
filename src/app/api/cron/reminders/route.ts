import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTrainingReminderEmail } from "@/lib/email";
import { sendePushAnNutzer } from "@/lib/push";
import { formatDateRange, formatVenueLines } from "@/lib/trainings/format";
import { cronGeprueft } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
// Mails und Push laufen nacheinander je Empfänger. Bricht Vercel am
// Standardlimit hart ab, läuft der catch unten nicht, die Tagesmarke bleibt
// stehen und der Tag ist verloren (Befund 05.09.2026).
export const maxDuration = 300;

// Erinnerung X Tage vor Schulungsbeginn. Der Cron läuft täglich; jede Schulung
// trifft das Tagesfenster genau einmal → keine doppelten Erinnerungen.
const DAYS_BEFORE = 3;

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(req: Request) {
  const gate = cronGeprueft(req);

  if (!gate.ok) {
    return gate.response;
  }

  const now = new Date();

  // Ein Lauf je Kalendertag: Der Vercel-Cron feuert einmal täglich, aber ein
  // Aufruf von Hand (Test, erneutes Deployment) darf nicht alle Erinnerungen
  // ein zweites Mal verschicken (Ultracode-Befund 13.08.2026).
  const tagesMarke = now.toISOString().slice(0, 10);
  try {
    await prisma.erinnerungsLauf.create({ data: { datum: tagesMarke } });
  } catch (fehler) {
    // Nur die Unique-Kollision heißt "heute bereits gelaufen". Jeder andere
    // Fehler (DB weg) muss als Fehler sichtbar werden, sonst fallen die
    // Erinnerungen still aus (Ultracode-Befund 13.08.2026).
    if (
      fehler instanceof Prisma.PrismaClientKnownRequestError &&
      fehler.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, uebersprungen: "heute bereits gelaufen", datum: tagesMarke });
    }
    throw fehler;
  }

  // Tagesfenster [heute + DAYS_BEFORE, heute + DAYS_BEFORE + 1) in UTC
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + DAYS_BEFORE)
  );
  const windowEnd = new Date(windowStart);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        user: { notifyBeforeTraining: true },
        // Abgesagte Kurse nicht mehr erinnern.
        training: { date: { gte: windowStart, lt: windowEnd }, cancelledAt: null },
      },
      select: {
        user: {
          select: { email: true, firstName: true, lastName: true, name: true },
        },
        training: {
          select: {
            title: true,
            code: true,
            date: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const enrollment of enrollments) {
      const { user, training } = enrollment;

      if (!user.email) {
        continue;
      }

      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.name ||
        null;

      const trainingTitle = training.code?.trim() || training.title;
      const dateText = formatDateRange(
        training.date.toISOString(),
        training.endDate ? training.endDate.toISOString() : null,
        "vom"
      );

      try {
        await sendTrainingReminderEmail({
          to: user.email,
          name,
          trainingTitle,
          dateText,
          location: training.location,
        });
        sent += 1;
      } catch (fehler) {
        // Die Tagesmarke steht, das Fenster wandert weiter: Für diesen
        // Empfänger gibt es keinen zweiten Versuch. Dann muss der Fall
        // wenigstens im Protokoll auffindbar sein (Befund 05.09.2026).
        console.error("REMINDER_MAIL_FEHLER", user.email, fehler);
        failed += 1;
      }
    }

    // Push aufs Handy am VORTAG (die E-Mail geht 3 Tage vorher): eigenes
    // Tagesfenster, damit jede Schulung genau einmal getroffen wird. Empfänger
    // ist, wer Erinnerungen wünscht UND auf mindestens einem Gerät die
    // Mitteilung aktiviert hat (PushAbo vorhanden).
    let pushGesendet = 0;
    let pushKandidaten = 0;
    try {
      const pushStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      const pushEnde = new Date(pushStart);
      pushEnde.setUTCDate(pushEnde.getUTCDate() + 1);

      const morgen = await prisma.enrollment.findMany({
        where: {
          status: { in: [...ACTIVE_STATUSES] },
          user: { notifyBeforeTraining: true, pushAbos: { some: {} } },
          training: { date: { gte: pushStart, lt: pushEnde }, cancelledAt: null },
        },
        select: {
          user: { select: { id: true } },
          training: { select: { title: true, code: true, location: true } },
        },
      });
      pushKandidaten = morgen.length;

      for (const anmeldung of morgen) {
        const kuerzel = anmeldung.training.code?.trim() || anmeldung.training.title;
        // Dieselbe Aufbereitung wie in "Meine Schulungen" — das Adressfeld beginnt
        // sonst gern mit dem Firmennamen ("A1-2701 in Henning GmbH & Co. KG").
        const ort = formatVenueLines(anmeldung.training.location, null)[0];
        pushGesendet += await sendePushAnNutzer(anmeldung.user.id, {
          titel: "Morgen ist es so weit",
          text: ort ? `${kuerzel} in ${ort}. Viel Erfolg!` : `${kuerzel}. Viel Erfolg!`,
          url: "/meine-schulungen",
        });
      }
    } catch (fehler) {
      console.error("PUSH_ERINNERUNG_FEHLER", getErrorMessage(fehler));
    }

    // Abgelaufene Registrierungsanforderungen wegräumen. Sie tragen
    // Passwort-Prüfwert, Name und Geburtsdatum von Leuten, aus denen nie ein
    // Konto wurde — die haben nach Ablauf des Links nichts mehr zu suchen.
    let aufgeraeumteRegistrierungen = 0;
    try {
      const geloescht = await prisma.offeneRegistrierung.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      aufgeraeumteRegistrierungen = geloescht.count;
    } catch (fehler) {
      console.error("REGISTRIERUNGEN_AUFRAEUMEN_FEHLER", fehler);
    }

    return NextResponse.json({
      ok: true,
      daysBefore: DAYS_BEFORE,
      window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
      candidates: enrollments.length,
      sent,
      failed,
      pushKandidaten,
      pushGesendet,
      aufgeraeumteRegistrierungen,
      triggeredAt: now.toISOString(),
    });
  } catch (error: unknown) {
    console.error("REMINDERS_FAILED", getErrorMessage(error));

    // Marke freigeben: Sonst verschluckt ein Absturz nach dem Eintrag alle
    // Erinnerungen des Tages, weil kein zweiter Versuch mehr möglich wäre.
    await prisma.erinnerungsLauf
      .delete({ where: { datum: tagesMarke } })
      .catch(() => {});

    return NextResponse.json(
      { ok: false, error: "REMINDERS_FAILED" },
      { status: 500 }
    );
  }
}
