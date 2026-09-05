import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MeineDatenForm from "./MeineDatenForm";
import PageHeader from "@/components/ui/PageHeader";

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
      isInstructor: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-main">
      {/* Formularbreite 720 wie Einstellungen (Launch-Runde 05.09.2026). */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <PageHeader title="Meine Daten" showTitle={true} />

        <MeineDatenForm
          // Dozenten: Der Name entscheidet über den Zugriff auf ihre Kurse,
          // deshalb pflegt ihn nur der Admin (Befund f06-1, 05.09.2026).
          namePflegtAdmin={user.isInstructor}
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
      </div>
    </main>
  );
}