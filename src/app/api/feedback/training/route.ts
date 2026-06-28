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

  const result = await submitFeedback({
    enrollmentId: body.enrollmentId,
    userEmail: email,
    anonymous: body.anonymous === true,
    answers: body.answers,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, creditsAwarded: result.creditsAwarded });
}
