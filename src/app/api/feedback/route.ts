import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Allgemein", "Fehler / Bug", "Idee / Wunsch", "Sonstiges"];

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
    return NextResponse.json(
      { ok: false, error: "FEEDBACK_SEND_FAILED", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
