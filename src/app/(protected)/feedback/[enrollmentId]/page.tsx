import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { authOptions } from "@/lib/auth";
import { getEnrollmentForFeedback } from "@/lib/feedback/service";
import FeedbackFormClient from "./FeedbackFormClient";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const { enrollmentId } = await params;
  const ctx = await getEnrollmentForFeedback(enrollmentId, session.user.email);

  // Nicht berechtigt, nicht abgeschlossen oder bereits abgegeben → zurück.
  if (!ctx || ctx.alreadySubmitted) redirect("/meine-zertifikate");

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <PageHeader title="Feedback zur Schulung" showTitle={true} />

        <FeedbackFormClient
          enrollmentId={ctx.enrollmentId}
          trainingTitle={ctx.displayTitle}
          sections={ctx.sections}
        />
      </div>
    </main>
  );
}
