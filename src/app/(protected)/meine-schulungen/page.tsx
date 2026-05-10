import PageHeader from "@/components/ui/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyTrainings } from "@/lib/trainings/service";
import MeineSchulungenClient from "./MeineSchulungenClient";

export const dynamic = "force-dynamic";

export default async function MeineSchulungenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const trainings = await getMyTrainings(session.user.email);

  const serializableTrainings = trainings.map((training) => ({
    ...training,
    date: training.date.toISOString(),
    endDate: training.endDate ? training.endDate.toISOString() : null,
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
          title="Meine Schulungen"
          description="Hier siehst du die Schulungen, die dir aktuell zugeordnet sind. Öffne eine Schulung, um Ort, Dozent, Inhalte, Credits und das Abschlussdokument zu sehen."
        />

        <MeineSchulungenClient trainings={serializableTrainings} />
      </div>
    </main>
  );
}