import { prisma } from "@/lib/prisma";
import {
  formatCertificateKind,
  getCertificateTemplateFileNameByCode,
} from "@/lib/certificates/templates";

function formatDate(date: Date | null | undefined) {
  if (!date) return "";

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function splitName(name: string | null | undefined) {
  const cleaned = String(name ?? "").trim();

  if (!cleaned) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts = cleaned.split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

export async function getCertificateDocumentData(certificateId: string) {
  const certificate = await prisma.certificate.findUnique({
    where: {
      id: certificateId,
    },
    select: {
      id: true,
      title: true,
      issuedAt: true,
      credits: true,
      code: true,
      certificateKind: true,
      user: {
        select: {
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          company: true,
          companyAddress: true,
          companyStreet: true,
          companyZip: true,
          companyCity: true,
          companyCountry: true,
          position: true,
        },
      },
      training: {
        select: {
          title: true,
          code: true,
          certificateKind: true,
          date: true,
          endDate: true,
          location: true,
          instructor: true,
          description: true,
          creditsAward: true,
        },
      },
    },
  });

  if (!certificate) {
    return null;
  }

  const fallbackName = splitName(certificate.user.name);

  const firstName =
    certificate.user.firstName?.trim() ||
    fallbackName.firstName ||
    "";

  const lastName =
    certificate.user.lastName?.trim() ||
    fallbackName.lastName ||
    "";

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const code = certificate.code || certificate.training.code || "";
  const certificateKind =
    certificate.certificateKind || certificate.training.certificateKind;

  const templateFileName = getCertificateTemplateFileNameByCode(code);

  const trainingDate = certificate.training.date;
  const trainingEndDate = certificate.training.endDate;

  const trainingPeriod = trainingEndDate
    ? `${formatDate(trainingDate)} bis ${formatDate(trainingEndDate)}`
    : formatDate(trainingDate);

  return {
    certificate,
    templateFileName,
    fileBaseName: buildCertificateFileName({
      code,
      fullName,
      title: certificate.training.title,
    }),
    data: {
      firstName,
      lastName,
      fullName,
      name: fullName,

      birthDate: formatDate(certificate.user.birthDate),
      email: certificate.user.email,
      gender: certificate.user.gender ?? "",

      company: certificate.user.company ?? "",
      companyAddress: certificate.user.companyAddress ?? "",
      companyStreet: certificate.user.companyStreet ?? "",
      companyZip: certificate.user.companyZip ?? "",
      companyCity: certificate.user.companyCity ?? "",
      companyCountry: certificate.user.companyCountry ?? "",
      position: certificate.user.position ?? "",

      certificateTitle: certificate.title,
      certificateKind: formatCertificateKind(certificateKind),
      certificateCode: code,
      code,

      trainingTitle: certificate.training.title,
      trainingCode: code,
      trainingDate: formatDate(trainingDate),
      trainingEndDate: formatDate(trainingEndDate),
      trainingPeriod,
      location: certificate.training.location ?? "",
      instructor: certificate.training.instructor ?? "",
      description: certificate.training.description ?? "",

      issuedAt: formatDate(certificate.issuedAt),
      credits: String(certificate.credits),
    },
  };
}

function buildCertificateFileName({
  code,
  fullName,
  title,
}: {
  code: string;
  fullName: string;
  title: string;
}) {
  const raw = [
    "VFA",
    code || "Zertifikat",
    fullName || "Teilnehmer",
    title || "Schulung",
  ]
    .filter(Boolean)
    .join("_");

  return raw
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}