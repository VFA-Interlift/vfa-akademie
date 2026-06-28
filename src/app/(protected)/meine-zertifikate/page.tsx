import PageHeader from "@/components/ui/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyCertificates } from "@/lib/certificates/service";
import { prisma } from "@/lib/prisma";
import { getFeedbackGivenEnrollmentIds } from "@/lib/feedback/service";
import MeineZertifikateClient from "./MeineZertifikateClient";

export const dynamic = "force-dynamic";

export default async function MeineZertifikatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();
  const certificates = await getMyCertificates(email);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const feedbackGiven = user ? await getFeedbackGivenEnrollmentIds(user.id) : new Set<string>();

  const serializableCertificates = certificates.map((cert) => ({
    ...cert,
    issuedAt: cert.issuedAt.toISOString(),
    trainingDate: cert.trainingDate.toISOString(),
    trainingEndDate: cert.trainingEndDate
      ? cert.trainingEndDate.toISOString()
      : null,
    feedbackGiven: feedbackGiven.has(cert.enrollmentId),
  }));

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Meine Zertifikate" showTitle={true} />

        <MeineZertifikateClient certificates={serializableCertificates} />
      </div>
    </main>
  );
}