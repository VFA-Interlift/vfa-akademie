import PageHeader from "@/components/ui/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyPastTrainings, getMyTrainings } from "@/lib/trainings/service";
import { getTrainingRecommendations } from "@/lib/trainings/recommendations";
import MeineSchulungenClient from "./MeineSchulungenClient";

export const dynamic = "force-dynamic";

export default async function MeineSchulungenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [trainings, past, recommendations] = await Promise.all([
    getMyTrainings(session.user.email),
    getMyPastTrainings(session.user.email),
    getTrainingRecommendations(session.user.email),
  ]);

  const serialisieren = (liste: typeof trainings) =>
    liste.map((training) => ({
      ...training,
      date: training.date.toISOString(),
      endDate: training.endDate ? training.endDate.toISOString() : null,
      cancelledAt: training.cancelledAt ? training.cancelledAt.toISOString() : null,
    }));

  const serializableTrainings = serialisieren(trainings);
  const serializablePast = serialisieren(past);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Meine Schulungen" showTitle={true} />

        <MeineSchulungenClient
          trainings={serializableTrainings}
          past={serializablePast}
          recommendations={recommendations}
        />
      </div>
    </main>
  );
}