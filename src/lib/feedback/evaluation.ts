import { prisma } from "@/lib/prisma";
import {
  flattenQuestions,
  getFeedbackForm,
  type FeedbackFormType,
  type FeedbackQuestion,
} from "@/lib/feedback/forms";
import { formTypeFor, instructorNamesFrom, type FeedbackAnswers } from "@/lib/feedback/service";

export type AdminQuestionStat = {
  key: string;
  label: string;
  type: FeedbackQuestion["type"];
  /** rating: Durchschnitt (1–5) bzw. null, wenn keine Antwort. */
  average: number | null;
  /** rating: Anzahl abgegebener Sternebewertungen. */
  ratingCount: number;
  /** single/multi: Häufigkeit je Option. */
  optionCounts: { option: string; count: number }[];
  /** text: gesammelte Freitexte (leere weggelassen). */
  textAnswers: string[];
};

export type AdminFeedbackSubmission = {
  id: string;
  createdAt: Date;
  anonymous: boolean;
  participantName: string | null;
  overallRating: number | null;
  answers: FeedbackAnswers;
};

export type AdminFeedbackTraining = {
  trainingId: string;
  trainingTitle: string;
  trainingCode: string | null;
  /**
   * Titel exakt wie ihn die Teilnehmenden im Feedback-Formular / auf der
   * Zertifikatskarte sehen (Zertifikats-Code bevorzugt). Verhindert, dass die
   * Auswertung eine Schulung anders benennt als der Teilnehmer sie kennt.
   */
  displayTitle: string;
  formType: FeedbackFormType;
  responseCount: number;
  overallAverage: number | null;
  questions: AdminQuestionStat[];
  submissions: AdminFeedbackSubmission[];
};

function participantNameOf(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.name?.trim()) return user.name.trim();
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return composed || user.email;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Aggregiert alle abgegebenen Feedbacks je Schulung: Durchschnitt je Sternfrage,
 * Verteilung der Auswahlfragen, gesammelte Freitexte und Einzelabgaben.
 * Anonyme Abgaben werden ohne Namen geführt.
 *
 * @param trainingId  optional auf eine Schulung einschränken (für Einzel-Export).
 */
export async function getAdminFeedbackEvaluation(
  trainingId?: string
): Promise<AdminFeedbackTraining[]> {
  const feedbacks = await prisma.trainingFeedback.findMany({
    where: trainingId ? { trainingId } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      anonymous: true,
      overallRating: true,
      answers: true,
      formType: true,
      training: { select: { id: true, title: true, code: true, instructor: true } },
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
      enrollment: { select: { certificate: { select: { code: true } } } },
    },
  });

  // Nach Schulung gruppieren (Reihenfolge: zuletzt bewertete zuerst).
  const groups = new Map<string, typeof feedbacks>();
  for (const fb of feedbacks) {
    const list = groups.get(fb.training.id) ?? [];
    list.push(fb);
    groups.set(fb.training.id, list);
  }

  const result: AdminFeedbackTraining[] = [];

  for (const [tId, list] of groups) {
    const training = list[0].training;
    const formType = formTypeFor(training);
    // Teilnehmer-Sicht: bevorzugt der Zertifikats-Code (z. B. „A1"), sonst der
    // Schulungs-Code, zuletzt der um Klammerzusätze bereinigte Titel.
    const certCode = list
      .map((fb) => fb.enrollment?.certificate?.code?.trim())
      .find((code): code is string => Boolean(code));
    const displayTitle =
      certCode ||
      training.code?.trim() ||
      training.title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    const sections = getFeedbackForm(formType, instructorNamesFrom(training.instructor));
    const questions = flattenQuestions(sections);

    const submissions: AdminFeedbackSubmission[] = list.map((fb) => ({
      id: fb.id,
      createdAt: fb.createdAt,
      anonymous: fb.anonymous,
      participantName: fb.anonymous ? null : participantNameOf(fb.user),
      overallRating: fb.overallRating,
      answers: (fb.answers as FeedbackAnswers) ?? {},
    }));

    const questionStats: AdminQuestionStat[] = questions.map((q) => {
      const stat: AdminQuestionStat = {
        key: q.key,
        label: q.label,
        type: q.type,
        average: null,
        ratingCount: 0,
        optionCounts: [],
        textAnswers: [],
      };

      if (q.type === "rating") {
        const values = submissions
          .map((s) => s.answers[q.key])
          .filter((v): v is number => typeof v === "number");
        stat.ratingCount = values.length;
        if (values.length) stat.average = round1(values.reduce((a, b) => a + b, 0) / values.length);
      } else if (q.type === "single" || q.type === "multi") {
        stat.optionCounts = (q.options ?? []).map((option) => {
          const count = submissions.filter((s) => {
            const v = s.answers[q.key];
            return q.type === "multi" ? Array.isArray(v) && v.includes(option) : v === option;
          }).length;
          return { option, count };
        });
      } else {
        stat.textAnswers = submissions
          .map((s) => s.answers[q.key])
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }

      return stat;
    });

    const overallValues = submissions
      .map((s) => s.overallRating)
      .filter((v): v is number => typeof v === "number");
    const overallAverage = overallValues.length
      ? round1(overallValues.reduce((a, b) => a + b, 0) / overallValues.length)
      : null;

    result.push({
      trainingId: tId,
      trainingTitle: training.title,
      trainingCode: training.code,
      displayTitle,
      formType,
      responseCount: list.length,
      overallAverage,
      questions: questionStats,
      submissions,
    });
  }

  return result;
}
