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

function formatTrainingDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
) {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  if (formattedStartDate && formattedEndDate) {
    if (formattedStartDate === formattedEndDate) {
      return `am ${formattedStartDate}`;
    }

    return `vom ${formattedStartDate} bis ${formattedEndDate}`;
  }

  if (formattedStartDate) {
    return `am ${formattedStartDate}`;
  }

  return "";
}

/**
 * Reduces a full address ("VFA, Süderstraße, Hamburg, Deutschland") to just
 * the city ("Hamburg") for the certificate participation line.
 */
function extractCity(location: string | null | undefined) {
  const cleaned = String(location ?? "").trim();

  if (!cleaned) return "";

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  const countries = [
    "deutschland",
    "germany",
    "österreich",
    "oesterreich",
    "austria",
    "schweiz",
    "switzerland",
  ];

  let candidate = parts[parts.length - 1];

  if (countries.includes(candidate.toLowerCase()) && parts.length >= 2) {
    candidate = parts[parts.length - 2];
  }

  // Drop a leading/trailing ZIP code ("20537 Hamburg" → "Hamburg")
  const withoutZip = candidate.replace(/\b\d{4,5}\b/g, "").trim();

  return withoutZip || candidate;
}

function normalizeInstructorPart(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function looksLikeAddressOrCompany(value: string) {
  const lower = value.toLowerCase();

  if (!value.trim()) return true;

  const blockedTerms = [
    "gmbh",
    "ag",
    "kg",
    "ug",
    "ohg",
    "e.k.",
    "straße",
    "strasse",
    "str.",
    "weg",
    "platz",
    "allee",
    "ring",
    "chaussee",
    "hamburg",
    "berlin",
    "münchen",
    "koeln",
    "köln",
    "düsseldorf",
    "stuttgart",
    "frankfurt",
    "hannover",
    "bremen",
  ];

  if (blockedTerms.some((term) => lower.includes(term))) {
    return true;
  }

  if (/\b\d{5}\b/.test(value)) {
    return true;
  }

  if (/\b\d{1,4}[a-z]?\b/i.test(value) && /[a-zäöüß]/i.test(value)) {
    return true;
  }

  return false;
}

function extractInstructorName(rawValue: string) {
  const cleaned = normalizeInstructorPart(rawValue);

  if (!cleaned) return "";

  const commaParts = cleaned
    .split(",")
    .map((part) => normalizeInstructorPart(part))
    .filter(Boolean);

  if (commaParts.length >= 2) {
    const possibleName = commaParts.find((part) => !looksLikeAddressOrCompany(part));

    if (possibleName) {
      return possibleName;
    }
  }

  if (looksLikeAddressOrCompany(cleaned)) {
    return "";
  }

  return cleaned;
}

function splitInstructors(rawValue: string | null | undefined) {
  const cleaned = String(rawValue ?? "").trim();

  if (!cleaned) return [];

  const values = cleaned
    .split(/\s*\|\s*|\s*;\s*|\n+/)
    .map((value) => extractInstructorName(value))
    .filter(Boolean);

  return Array.from(new Set(values));
}

function formatInstructorTable(rawValue: string | null | undefined) {
  const instructors = splitInstructors(rawValue);

  if (instructors.length === 0) {
    return "";
  }

  return instructors
    .map((instructor) => {
      const { firstName, lastName } = splitName(instructor);

      if (firstName && lastName) {
        return `${lastName}, ${firstName}`;
      }

      return instructor;
    })
    .join("\n");
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
    certificate.user.firstName?.trim() || fallbackName.firstName || "";

  const lastName =
    certificate.user.lastName?.trim() || fallbackName.lastName || "";

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

  const trainingDateRange = formatTrainingDateRange(
    trainingDate,
    trainingEndDate
  );

  const trainingLocation = certificate.training.location ?? "";
  const trainingCity = extractCity(trainingLocation);
  const instructor = certificate.training.instructor ?? "";
  const instructorTable = formatInstructorTable(instructor);

  const participantBirthDate = formatDate(certificate.user.birthDate);
  const issuedAt = formatDate(certificate.issuedAt);

  return {
    certificate,
    templateFileName,
    fileBaseName: buildCertificateFileName({
      code,
      fullName,
      title: certificate.training.title,
    }),
    data: {
      participantName: fullName,
      participantFirstName: firstName,
      participantLastName: lastName,
      participantBirthDate,

      trainingTitle: certificate.training.title,
      trainingCode: code,
      trainingDateRange,
      trainingLocation,
      instructorTable,

      // Completes the pre-printed certificate text:
      // "[Name] geb. … hat am/vom … in [Stadt]  ‹an folgender VFA-Schulung teilgenommen›"
      participationDetails: ["hat", trainingDateRange, trainingCity ? `in ${trainingCity}` : ""]
        .filter(Boolean)
        .join(" "),

      certificateTitle: certificate.title,
      certificateKind: formatCertificateKind(certificateKind),
      certificateCode: code,
      certificateDate: issuedAt,
      certificateLocation: "Hamburg",

      credits: String(certificate.credits),

      firstName,
      lastName,
      fullName,
      name: fullName,

      birthDate: participantBirthDate,
      email: certificate.user.email,
      gender: certificate.user.gender ?? "",

      company: certificate.user.company ?? "",
      companyAddress: certificate.user.companyAddress ?? "",
      companyStreet: certificate.user.companyStreet ?? "",
      companyZip: certificate.user.companyZip ?? "",
      companyCity: certificate.user.companyCity ?? "",
      companyCountry: certificate.user.companyCountry ?? "",
      position: certificate.user.position ?? "",

      code,

      trainingDate: formatDate(trainingDate),
      trainingEndDate: formatDate(trainingEndDate),
      trainingPeriod,
      location: trainingLocation,
      instructor,
      description: certificate.training.description ?? "",

      issuedAt,
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