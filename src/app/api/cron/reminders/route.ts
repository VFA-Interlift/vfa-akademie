import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrainingReminderEmail } from "@/lib/email";
import { sendePushAnNutzer } from "@/lib/push";
import { formatDateRange } from "@/lib/trainings/format";

export const dynamic = "force-dynamic";

// Erinnerung X Tage vor Schulungsbeginn. Der Cron läuft täglich; jede Schulung
// trifft das Tagesfenster genau einmal → keine doppelten Erinnerungen.
const DAYS_BEFORE = 3;

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"] as const;

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { ok: false as const, response: fail("CRON_SECRET_NOT_CONFIGURED", 500) };
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return { ok: false as const, response: fail("UNAUTHORIZED", 401) };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  const gate = isAuthorized(req);

  if (!gate.ok) {
    return gate.response;
  }

  const now = new Date();

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
      } catch {
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
        const ort = anmeldung.training.location?.split(",")[0]?.trim();
        pushGesendet += await sendePushAnNutzer(anmeldung.user.id, {
          titel: "Morgen ist es so weit",
          text: ort ? `${kuerzel} in ${ort} — viel Erfolg!` : `${kuerzel} — viel Erfolg!`,
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

    return NextResponse.json(
      { ok: false, error: "REMINDERS_FAILED" },
      { status: 500 }
    );
  }
}
