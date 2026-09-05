import PageHeader from "@/components/ui/PageHeader";
import { getAdminFeedbackEvaluation } from "@/lib/feedback/evaluation";
import AdminFeedbackClient from "./AdminFeedbackClient";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const evaluation = await getAdminFeedbackEvaluation();

  const data = evaluation.map((training) => ({
    ...training,
    submissions: training.submissions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
  }));

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <PageHeader title="Feedback-Auswertung" showTitle={true} />
        <AdminFeedbackClient trainings={data} />
      </div>
    </main>
  );
}
