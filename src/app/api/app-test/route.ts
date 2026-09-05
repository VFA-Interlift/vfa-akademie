import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAppTestFeedbackEmail } from "@/lib/email";
import { istTester } from "@/lib/app-test/tester";
import {
  APP_TEST_FRAGEN,
  APP_TEST_FRAGEN_BY_ID,
  APP_TEST_TEXT_MAX,
  PFLICHT_FRAGE_ID,
  type Frage,
} from "@/lib/app-test/fragen";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Nimmt genau die Werte an, die zur jeweiligen Frage passen. Alles andere wird
 * verworfen, statt es ungeprueft in die Datenbank zu schreiben.
 */
function pruefeAntwort(frage: Frage, wert: unknown): string | number | string[] | null {
  if (frage.typ === "skala") {
    const n = typeof wert === "number" ? wert : Number(wert);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    return n;
  }

  if (frage.typ === "auswahl") {
    if (frage.mehrfach) {
      if (!Array.isArray(wert)) return null;
      const gewaehlt = wert.filter(
        (v): v is string => typeof v === "string" && frage.optionen.includes(v)
      );
      return gewaehlt.length ? gewaehlt : null;
    }
    return typeof wert === "string" && frage.optionen.includes(wert) ? wert : null;
  }

  if (typeof wert !== "string") return null;
  const text = wert.trim();
  if (!text) return null;
  return text.slice(0, APP_TEST_TEXT_MAX);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // Der Bogen gehoert zur Testrunde. Wer nicht dazugehoert, hat hier nichts
  // verloren - auch nicht per direktem Aufruf der Route.
  if (!istTester(email)) {
    return NextResponse.json({ ok: false, error: "KEIN_TESTER" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const eingang = body?.answers;
  if (!eingang || typeof eingang !== "object" || Array.isArray(eingang)) {
    return NextResponse.json({ ok: false, error: "UNGUELTIG" }, { status: 400 });
  }

  const answers: Record<string, string | number | string[]> = {};
  for (const frage of APP_TEST_FRAGEN) {
    const wert = pruefeAntwort(frage, (eingang as Record<string, unknown>)[frage.id]);
    if (wert !== null) answers[frage.id] = wert;
  }

  const gesamt = answers[PFLICHT_FRAGE_ID];
  if (typeof gesamt !== "number") {
    return NextResponse.json({ ok: false, error: "GESAMTNOTE_FEHLT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, firstName: true, lastName: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "UNBEKANNT" }, { status: 404 });
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name || null;

  // Erst speichern, dann melden: geht die Mail nicht raus, sind die Antworten
  // trotzdem sicher.
  await prisma.appTestFeedback.upsert({
    where: { userId: user.id },
    create: { userId: user.id, answers, overallRating: gesamt },
    update: { answers, overallRating: gesamt },
  });

  try {
    await sendAppTestFeedbackEmail({
      fromUserEmail: email,
      fromUserName: name,
      overallRating: gesamt,
      antworten: APP_TEST_FRAGEN.map((f) => ({
        frage: f.text,
        antwort: answers[f.id],
      })),
    });
  } catch (error: unknown) {
    // Die Rueckmeldung liegt in der Datenbank, deshalb ist das kein Fehlschlag
    // fuer den Tester.
    console.error("APP_TEST_MAIL_FEHLGESCHLAGEN", getErrorMessage(error));
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  // Wie bei POST: nicht angemeldet (401) und kein Tester (403) getrennt.
  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }
  if (!istTester(email)) {
    return NextResponse.json({ ok: false, error: "KEIN_TESTER" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { appTestFeedback: { select: { answers: true, updatedAt: true } } },
  });

  return NextResponse.json({
    ok: true,
    fragen: APP_TEST_FRAGEN,
    pflicht: PFLICHT_FRAGE_ID,
    bereitsGesendet: Boolean(user?.appTestFeedback),
    antworten: user?.appTestFeedback?.answers ?? null,
    bekannt: Object.keys(APP_TEST_FRAGEN_BY_ID).length,
  });
}
