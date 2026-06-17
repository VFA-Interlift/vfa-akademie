import PageHeader from "@/components/ui/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyCertificates } from "@/lib/certificates/service";
import MeineZertifikateClient from "./MeineZertifikateClient";

export const dynamic = "force-dynamic";

export default async function MeineZertifikatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const certificates = await getMyCertificates(session.user.email);

  const serializableCertificates = certificates.map((cert) => ({
    ...cert,
    issuedAt: cert.issuedAt.toISOString(),
    trainingDate: cert.trainingDate.toISOString(),
    trainingEndDate: cert.trainingEndDate
      ? cert.trainingEndDate.toISOString()
      : null,
  }));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title="Meine Zertifikate"
          description="Hier findest du deine Teilnahmebestätigungen und Zertifikate aus abgeschlossenen Schulungen. Über den Jahresfilter bleibt die Übersicht auch bei vielen Schulungen schlank."
          showTitle={false}
        />

        <MeineZertifikateClient certificates={serializableCertificates} />
      </div>
    </main>
  );
}