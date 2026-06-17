import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MeineDatenForm from "./MeineDatenForm";
import PageHeader from "@/components/ui/PageHeader";
import AppCard from "@/components/ui/AppCard";

export const dynamic = "force-dynamic";

function formatBirthDate(date: Date | null) {
  if (!date) return "";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return `${day}.${month}.${year}`;
}

export default async function MeineDatenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      gender: true,
      phone: true,
      company: true,
      companyAddress: true,
      companyStreet: true,
      companyZip: true,
      companyCity: true,
      companyCountry: true,
      position: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Meine Daten" showTitle={true} />

        <AppCard accent="green">
          <MeineDatenForm
            initial={{
              email: user.email ?? "",
              name: user.name ?? "",
              firstName: user.firstName ?? "",
              lastName: user.lastName ?? "",
              birthDate: formatBirthDate(user.birthDate),
              gender: user.gender ?? "",
              phone: user.phone ?? "",
              company: user.company ?? "",
              companyAddress: user.companyAddress ?? "",
              companyStreet: user.companyStreet ?? "",
              companyZip: user.companyZip ?? "",
              companyCity: user.companyCity ?? "",
              companyCountry: user.companyCountry ?? "Deutschland",
              position: user.position ?? "",
            }}
          />
        </AppCard>
      </div>
    </main>
  );
}