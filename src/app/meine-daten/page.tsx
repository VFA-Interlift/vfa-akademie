import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MeineDatenForm from "./MeineDatenForm";

export default async function MeineDatenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Meine Daten
      </h1>

      <MeineDatenForm
        initial={{
          name: user.name ?? "",
          email: user.email ?? "",
          company: (user as any).company ?? "",
          gender: (user as any).gender ?? "",
          companyAddress: (user as any).companyAddress ?? "",
          birthDate: user.birthDate ? user.birthDate.toLocaleDateString("de-DE") : "",
        }}
      />
    </main>
  );
}
