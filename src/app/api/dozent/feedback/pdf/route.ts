import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminFeedbackEvaluation } from "@/lib/feedback/evaluation";
import { renderFeedbackReportPdf } from "@/lib/feedback/report-pdf";
import { instructorNamesFrom } from "@/lib/feedback/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Feedback-Auswertung als PDF für den Dozenten der Schulung.
 * Zugriff nur, wenn der eingeloggte Nutzer Dozentenrolle hat UND
 * namentlich als Dozent der Schulung hinterlegt ist.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { isInstructor: true, role: true, firstName: true, lastName: true, name: true },
  });
  if (!me?.isInstructor && me?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId");
  if (!trainingId) return NextResponse.json({ ok: false, error: "MISSING_TRAINING" }, { status: 400 });

  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { code: true, title: true, instructor: true },
  });
  if (!training) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });

  // Namens-Match: nur der eigene Dozent (oder Admin) darf die Auswertung laden.
  if (me.role !== "ADMIN") {
    const dozentNames = instructorNamesFrom(training.instructor).map(normalize);
    const profileNames = [
      [me.firstName, me.lastName].filter(Boolean).join(" "),
      me.name ?? "",
    ]
      .map(normalize)
      .filter(Boolean);

    const isMatch = dozentNames.some((d) =>
      profileNames.some((p) => {
        const parts = p.split(" ").filter(Boolean);
        return parts.length >= 2 && parts.every((part) => d.includes(part));
      })
    );
    if (!isMatch) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const evaluation = await getAdminFeedbackEvaluation(trainingId);
  if (evaluation.length === 0) {
    return NextResponse.json({ ok: false, error: "NO_FEEDBACK" }, { status: 404 });
  }

  const pdf = await renderFeedbackReportPdf(evaluation);
  const safeName = (training.code?.trim() || training.title).replace(/[^\w-]+/g, "_");

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="feedback-${safeName}.pdf"`,
    },
  });
}
