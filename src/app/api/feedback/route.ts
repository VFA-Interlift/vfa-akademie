import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackEmail } from "@/lib/email";
import { bremsePruefen } from "@/lib/bremse";

export const dynamic = "force-dynamic";

/** Muss zur Liste in EinstellungenClient.tsx passen. */
const CATEGORIES = ["Allgemein", "Fehler", "Idee / Wunsch", "Sonstiges"];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // Jede Anfrage wird zur Mail an die Geschäftsstelle — ohne Bremse ließe
  // sich das Postfach fluten (Befund f05-6, 05.09.2026).
  const bremse = bremsePruefen(`feedback:${email.trim().toLowerCase()}`, {
    versuche: 5,
    fensterSekunden: 600,
    sperreSekunden: 900,
  });
  if (!bremse.erlaubt) {
    return NextResponse.json({ ok: false, error: "ZU_VIELE_VERSUCHE" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const category =
    typeof body?.category === "string" && CATEGORIES.includes(body.category)
      ? body.category
      : "Allgemein";

  if (message.length < 5) {
    return NextResponse.json({ ok: false, error: "MESSAGE_TOO_SHORT" }, { status: 400 });
  }

  if (message.length > 5000) {
    return NextResponse.json({ ok: false, error: "MESSAGE_TOO_LONG" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { name: true, firstName: true, lastName: true },
  });

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name ||
    null;

  try {
    await sendFeedbackEmail({
      fromUserEmail: email,
      fromUserName: name,
      category,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // Interna gehören ins Protokoll, nicht in die Antwort.
    console.error("FEEDBACK_SEND_FAILED", getErrorMessage(error));

    return NextResponse.json(
      { ok: false, error: "FEEDBACK_SEND_FAILED" },
      { status: 500 }
    );
  }
}
