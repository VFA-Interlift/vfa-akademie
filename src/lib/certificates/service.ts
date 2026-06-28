import type { CertificateKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCertificateKind } from "@/lib/certificates/templates";

export type MyCertificateItem = {
  id: string;
  enrollmentId: string;
  title: string;
  issuedAt: Date;
  credits: number;
  status: string;

  code: string | null;
  certificateKind: CertificateKind | null;
  certificateKindLabel: string;

  trainingTitle: string;
  trainingDate: Date;
  trainingEndDate: Date | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  pdfUrl: string | null;
};

export async function getMyCertificates(
  email: string
): Promise<MyCertificateItem[]> {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
    },
  });

  if (!user) return [];

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: user.id,
      status: "ISSUED",
    },
    orderBy: [
      {
        issuedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      enrollmentId: true,
      title: true,
      issuedAt: true,
      credits: true,
      status: true,
      code: true,
      certificateKind: true,
      pdfUrl: true,
      training: {
        select: {
          title: true,
          date: true,
          endDate: true,
          location: true,
          instructor: true,
          description: true,
        },
      },
    },
  });

  return certificates.map((cert) => ({
    id: cert.id,
    enrollmentId: cert.enrollmentId,
    title: cert.title,
    issuedAt: cert.issuedAt,
    credits: cert.credits,
    status: cert.status,

    code: cert.code,
    certificateKind: cert.certificateKind,
    certificateKindLabel: formatCertificateKind(cert.certificateKind),

    pdfUrl: cert.pdfUrl,
    trainingTitle: cert.training.title,
    trainingDate: cert.training.date,
    trainingEndDate: cert.training.endDate,
    location: cert.training.location,
    instructor: cert.training.instructor,
    description: cert.training.description,
  }));
}