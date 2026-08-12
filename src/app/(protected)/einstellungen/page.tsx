import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import { istTester } from "@/lib/app-test/tester";
import EinstellungenClient from "./EinstellungenClient";

export const dynamic = "force-dynamic";

export default async function EinstellungenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      notifyBeforeTraining: true,
      appTestFeedback: { select: { id: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <PageHeader title="Einstellungen" showTitle={true} />

        <EinstellungenClient
          notifyBeforeTraining={user.notifyBeforeTraining}
          istTester={istTester(email)}
          feedbackGesendet={Boolean(user.appTestFeedback)}
        />
      </div>
    </main>
  );
}
