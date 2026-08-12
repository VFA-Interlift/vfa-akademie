import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitFeedback } from "@/lib/feedback/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: { enrollmentId?: unknown; anonymous?: unknown; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  if (typeof body.enrollmentId !== "string" || !body.enrollmentId) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  let result;
  try {
    result = await submitFeedback({
      enrollmentId: body.enrollmentId,
      userEmail: email,
      anonymous: body.anonymous === true,
      answers: body.answers,
    });
  } catch (error) {
    // Ein DB-Aussetzer während der Credit-Transaktion darf dem Handy nicht die
    // generische Next-500-Seite liefern — die App könnte sie nicht anzeigen.
    console.error("TRAINING_FEEDBACK_ERROR", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, creditsAwarded: result.creditsAwarded });
}
