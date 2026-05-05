import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import MeineDatenForm from "./MeineDatenForm";

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
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#fff" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <BackButton label="Zurück" />
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
          Meine Daten
        </h1>
      </div>

      <p style={{ color: "#aaa", marginBottom: 24 }}>
        Hier kannst du deine persönlichen Daten und Firmendaten pflegen.
        Diese Angaben können später für Schulungen, Zertifikate und die Cobra-Synchronisation genutzt werden.
      </p>

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
    </main>
  );
}