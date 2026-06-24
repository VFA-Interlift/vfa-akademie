import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMyCertificates } from "@/lib/certificates/service";
import KompetenzpassClient from "./KompetenzpassClient";

export const dynamic = "force-dynamic";

export default async function KompetenzpassPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      company: true,
      position: true,
      creditsTotal: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const certificates = await getMyCertificates(email);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name?.trim() ||
    "";

  const serializableCertificates = certificates.map((cert) => ({
    id: cert.id,
    code: cert.code,
    title: cert.title,
    certificateKindLabel: cert.certificateKindLabel,
    credits: cert.credits,
    issuedAt: cert.issuedAt.toISOString(),
    trainingTitle: cert.trainingTitle,
    trainingDate: cert.trainingDate.toISOString(),
    trainingEndDate: cert.trainingEndDate
      ? cert.trainingEndDate.toISOString()
      : null,
    location: cert.location,
    instructor: cert.instructor,
  }));

  return (
    <KompetenzpassClient
      displayName={displayName}
      company={user.company}
      position={user.position}
      creditsTotal={user.creditsTotal}
      memberSince={user.createdAt.toISOString()}
      certificates={serializableCertificates}
    />
  );
}
