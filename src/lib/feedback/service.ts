import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatInstructorName, isLikelyInhouse } from "@/lib/trainings/format";
import {
  FEEDBACK_CREDITS,
  OVERALL_RATING_KEY,
  flattenQuestions,
  getFeedbackForm,
  type FeedbackFormType,
  type FeedbackSection,
} from "@/lib/feedback/forms";

/** Status, ab dem eine abgeschlossene Schulung Feedback erlaubt. */
const COMPLETED_STATUS = "CERTIFICATE_ISSUED" as const;

export type FeedbackAnswerValue = number | string | string[];
export type FeedbackAnswers = Record<string, FeedbackAnswerValue>;

/** Zerlegt das (formatierte) Cobra-Dozentenfeld in einzelne Personennamen. */
export function instructorNamesFrom(instructor: string | null): string[] {
  const formatted = formatInstructorName(instructor);
  if (!formatted || formatted === "Noch nicht hinterlegt") return [];
  return formatted
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function formTypeFor(training: { title: string; code: string | null }): FeedbackFormType {
  return isLikelyInhouse(training.title, training.code) ? "INHOUSE" : "PUBLIC";
}

export type EnrollmentForFeedback = {
  enrollmentId: string;
  trainingTitle: string;
  trainingCode: string | null;
  formType: FeedbackFormType;
  instructorNames: string[];
  sections: FeedbackSection[];
  alreadySubmitted: boolean;
};

/**
 * Lädt eine Anmeldung für die Feedback-Abgabe, prüft Eigentümerschaft und
 * Abschluss-Status. Liefert `null`, wenn die Anmeldung nicht existiert, nicht
 * dem Nutzer gehört oder die Schulung noch nicht abgeschlossen ist.
 */
export async function getEnrollmentForFeedback(
  enrollmentId: string,
  userEmail: string
): Promise<EnrollmentForFeedback | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      user: { select: { email: true } },
      training: { select: { title: true, code: true, instructor: true } },
      feedback: { select: { id: true } },
    },
  });

  if (!enrollment) return null;
  if (enrollment.user.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()) return null;
  if (enrollment.status !== COMPLETED_STATUS) return null;

  const formType = formTypeFor(enrollment.training);
  const instructorNames = instructorNamesFrom(enrollment.training.instructor);

  return {
    enrollmentId: enrollment.id,
    trainingTitle: enrollment.training.title,
    trainingCode: enrollment.training.code,
    formType,
    instructorNames,
    sections: getFeedbackForm(formType, instructorNames),
    alreadySubmitted: Boolean(enrollment.feedback),
  };
}

type SubmitResult =
  | { ok: true; creditsAwarded: number }
  | { ok: false; status: number; error: string };

/** Validiert die Roh-Antworten gegen den Fragenkatalog und gibt bereinigte Werte zurück. */
function validateAnswers(sections: FeedbackSection[], raw: unknown): FeedbackAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const questions = flattenQuestions(sections);
  const cleaned: FeedbackAnswers = {};

  for (const q of questions) {
    const value = input[q.key];
    if (value === undefined || value === null || value === "") continue;

    if (q.type === "rating") {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 1 || num > 5) return null;
      cleaned[q.key] = num;
    } else if (q.type === "text") {
      if (typeof value !== "string") return null;
      const trimmed = value.trim().slice(0, 2000);
      if (trimmed) cleaned[q.key] = trimmed;
    } else if (q.type === "single") {
      if (typeof value !== "string" || !q.options?.includes(value)) return null;
      cleaned[q.key] = value;
    } else if (q.type === "multi") {
      if (!Array.isArray(value)) return null;
      const picked = value.filter((v): v is string => typeof v === "string" && Boolean(q.options?.includes(v)));
      if (picked.length) cleaned[q.key] = picked;
    }
  }

  // Pflichtfeld: Gesamtzufriedenheit
  if (typeof cleaned[OVERALL_RATING_KEY] !== "number") return null;

  return cleaned;
}

/**
 * Speichert das Feedback und schreibt dem Nutzer einmalig {@link FEEDBACK_CREDITS}
 * Credits gut – alles in einer Transaktion. Doppelabgabe wird über den
 * `enrollmentId`-Unique-Constraint verhindert.
 */
export async function submitFeedback(params: {
  enrollmentId: string;
  userEmail: string;
  anonymous: boolean;
  answers: unknown;
}): Promise<SubmitResult> {
  const ctx = await getEnrollmentForFeedback(params.enrollmentId, params.userEmail);
  if (!ctx) return { ok: false, status: 403, error: "NOT_ELIGIBLE" };
  if (ctx.alreadySubmitted) return { ok: false, status: 409, error: "ALREADY_SUBMITTED" };

  const answers = validateAnswers(ctx.sections, params.answers);
  if (!answers) return { ok: false, status: 400, error: "INVALID_ANSWERS" };

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.enrollmentId },
    select: { userId: true, trainingId: true },
  });
  if (!enrollment) return { ok: false, status: 403, error: "NOT_ELIGIBLE" };

  const overallRating = answers[OVERALL_RATING_KEY] as number;

  try {
    await prisma.$transaction(async (tx) => {
      const feedback = await tx.trainingFeedback.create({
        data: {
          userId: enrollment.userId,
          trainingId: enrollment.trainingId,
          enrollmentId: params.enrollmentId,
          formType: ctx.formType,
          anonymous: params.anonymous,
          overallRating,
          answers: answers as Prisma.InputJsonValue,
          creditsAwarded: FEEDBACK_CREDITS,
        },
        select: { id: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId: enrollment.userId,
          amount: FEEDBACK_CREDITS,
          type: "AWARD",
          reason: "FEEDBACK_SUBMITTED",
          trainingId: enrollment.trainingId,
          feedbackId: feedback.id,
          meta: { kind: "FEEDBACK_CREDITS", enrollmentId: params.enrollmentId },
        },
      });

      await tx.user.update({
        where: { id: enrollment.userId },
        data: { creditsTotal: { increment: FEEDBACK_CREDITS } },
      });
    });
  } catch (err) {
    // Unique-Verletzung (enrollmentId) = parallele Doppelabgabe
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
      return { ok: false, status: 409, error: "ALREADY_SUBMITTED" };
    }
    throw err;
  }

  return { ok: true, creditsAwarded: FEEDBACK_CREDITS };
}

/** Anzahl abgeschlossener Schulungen ohne Feedback (für die Dashboard-Infobox). */
export async function getOpenFeedbackCount(userId: string): Promise<number> {
  return prisma.enrollment.count({
    where: {
      userId,
      status: COMPLETED_STATUS,
      feedback: { is: null },
    },
  });
}

/** Menge der Enrollment-IDs, für die der Nutzer bereits Feedback abgegeben hat. */
export async function getFeedbackGivenEnrollmentIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.trainingFeedback.findMany({
    where: { userId },
    select: { enrollmentId: true },
  });
  return new Set(rows.map((row) => row.enrollmentId));
}
