import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { istTester } from "@/lib/app-test/tester";
import AppTestClient from "./AppTestClient";

export const dynamic = "force-dynamic";

export default async function AppTestPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  // Der Bogen gehoert zur Testrunde. Alle anderen landen auf der Startseite,
  // ohne zu erfahren, dass es die Seite gibt.
  if (!istTester(session.user.email)) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { appTestFeedback: { select: { id: true } } },
  });

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <PageHeader title="Deine Rückmeldung zur App" showTitle={true} />

        <AppTestClient bereitsGesendet={Boolean(user?.appTestFeedback)} />
      </div>
    </main>
  );
}
