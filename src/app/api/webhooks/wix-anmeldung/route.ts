import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Webhook der Wix-Website: wird direkt beim Absenden der Schulungsanmeldung
 * aufgerufen (parallel zu Cobra), damit die Anmeldung sofort in der App ist —
 * ohne auf den langsamen Cobra/Fluctus-Umweg zu warten.
 *
 * Ablauf:
 *  1. Schulung per Kurscode matchen (Wix „kurscode" == Training.code).
 *  2. Teilnehmer in die bestehende Staging-Tabelle schreiben
 *     (CobraTrainingParticipant, participantType WIX_WEBSITE) — dadurch greift
 *     das vorhandene E-Mail-Matching: Auto-Enroll bei Registrierung und der
 *     Admin-Abgleich funktionieren unverändert.
 *  3. Existiert der App-Account (Teilnehmer-E-Mail) bereits, wird die
 *     Anmeldung sofort als Enrollment (PENDING) angelegt.
 *
 * Auth: Header `x-webhook-secret` muss WIX_WEBHOOK_SECRET (Vercel-Env) entsprechen.
 */

type WixAnmeldungPayload = {
  anmeldungId?: string;
  kurscode?: string;
  kurscodeAnzeige?: string;
  kursTitel?: string;
  t1Vorname?: string;
  t1Nachname?: string;
  t1Email?: string;
  t1Telefon?: string;
  t1Geburtstag?: string;
  firma?: string;
  mitgliedstyp?: string;
  mailKontakt?: string;
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const secret = process.env.WIX_WEBHOOK_SECRET;
  if (!secret) return fail("WEBHOOK_SECRET_NOT_CONFIGURED", 500);
  if (req.headers.get("x-webhook-secret") !== secret) return fail("UNAUTHORIZED", 401);

  const body = (await req.json().catch(() => null)) as WixAnmeldungPayload | null;
  if (!body || typeof body !== "object") return fail("INVALID_JSON");

  const kurscode = clean(body.kurscode) ?? clean(body.kurscodeAnzeige);
  const rawEmail = clean(body.t1Email)?.toLowerCase() ?? null;
  // E-Mail ist optional (manche Cobra-Altdaten haben keine): ohne E-Mail wird
  // der Teilnehmer nur für die Anwesenheitsliste geführt, ohne App-Matching.
  const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : null;
  const firstName = clean(body.t1Vorname);
  const lastName = clean(body.t1Nachname);

  if (!kurscode) return fail("MISSING_KURSCODE");
  if (!firstName || !lastName) return fail("MISSING_PARTICIPANT_NAME");

  // 1) Schulung matchen (Code exakt, case-insensitiv).
  const training = await prisma.training.findFirst({
    where: { code: { equals: kurscode, mode: "insensitive" } },
    select: { id: true, code: true, title: true },
  });

  if (!training) {
    // Ohne Treffer wird der Teilnehmer zwar gespeichert, hängt aber an keiner
    // Schulung: keine Einschreibung, kein Zertifikat, keine Credits. Die
    // Antwort bleibt bewusst ok (die Anmeldung ist ja angekommen), deshalb
    // muss das hier auffindbar protokolliert werden.
    console.error("WIX_ANMELDUNG_OHNE_SCHULUNG", { kurscode });
  }

  // 2) Staging-Eintrag (idempotent über die Wix-Anmeldungs-ID; ohne E-Mail
  //    über den Namen).
  const kurscodeSlug = kurscode.toLowerCase().replace(/[^a-z0-9]+/gi, "_");
  const personKey = email ?? `${firstName} ${lastName}`.toLowerCase().replace(/[^a-zà-ÿ0-9]+/gi, "_");
  const stagingId = clean(body.anmeldungId)
    ? `wix-${clean(body.anmeldungId)}`
    : `wix-${personKey}-${kurscodeSlug}`;

  const participantText = `${firstName} ${lastName}`;

  // Erneute Formularabsendung derselben Person: Wix vergibt dafür eine neue
  // Anmeldungs-ID, die sonst eine zweite Staging-Zeile zum selben Kurs anlegte.
  // Die Dublette stünde doppelt in der Anwesenheitsliste des Dozenten, und eine
  // als abwesend markierte Zweitzeile blockierte das Zertifikat des real
  // Anwesenden. Deshalb: bestehende Zeile derselben E-Mail am selben Training
  // aktualisieren statt eine neue anzulegen; die gepflegte Anwesenheit bleibt
  // dabei unangetastet (20.08.2026).
  const vorhandene =
    training && email
      ? await prisma.cobraTrainingParticipant.findFirst({
          where: {
            participantType: "WIX_WEBSITE",
            trainingId: training.id,
            email,
            NOT: { cobraParticipantId: stagingId },
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
      : null;

  if (vorhandene) {
    await prisma.cobraTrainingParticipant.update({
      where: { id: vorhandene.id },
      data: {
        caption: clean(body.kursTitel) ?? kurscode,
        participantText,
        firstName,
        lastName,
        company: clean(body.firma),
        raw: body as object,
      },
    });
  } else {
    await prisma.cobraTrainingParticipant.upsert({
      where: { cobraParticipantId: stagingId },
      create: {
        cobraParticipantId: stagingId,
        cobraTrainingCaption: null,
        cobraTrainingId: null,
        trainingId: training?.id ?? null,
        caption: clean(body.kursTitel) ?? kurscode,
        participantText,
        participantType: "WIX_WEBSITE",
        status: "ANGEMELDET",
        email,
        firstName,
        lastName,
        company: clean(body.firma),
        raw: body as object,
      },
      update: {
        trainingId: training?.id ?? null,
        caption: clean(body.kursTitel) ?? kurscode,
        participantText,
        email,
        firstName,
        lastName,
        company: clean(body.firma),
        raw: body as object,
      },
    });
  }

  // 3) Hat der Teilnehmer schon ein bestätigtes Konto → sofort einschreiben.
  //    Unbestätigte Konten bleiben außen vor: sonst könnte sich jemand mit einer
  //    fremden Adresse anmelden und bekäme deren Schulungen zugespielt, ohne den
  //    Bestätigungslink je geöffnet zu haben.
  let enrolled = false;
  if (training && email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true },
    });

    if (user?.emailVerifiedAt) {
      // CONFIRMED, nicht PENDING: Eine abgeschickte Website-Anmeldung ist eine
      // verbindliche Anmeldung — genauso wie beim Nachziehen während der
      // Registrierung (api/register) und beim Admin-Abgleich. Mit PENDING
      // übersieht der Zertifikats-Cron diese Anmeldung dauerhaft, weil er nur
      // CONFIRMED/ATTENDED/COMPLETED verarbeitet: kein Zertifikat, keine
      // Credits, kein Feedback.
      await prisma.enrollment.upsert({
        where: { userId_trainingId: { userId: user.id, trainingId: training.id } },
        create: { userId: user.id, trainingId: training.id, status: "CONFIRMED" },
        update: {},
      });
      enrolled = true;
    }
  }

  return NextResponse.json({
    ok: true,
    matchedTraining: training ? { id: training.id, code: training.code } : null,
    staged: true,
    enrolled,
  });
}
