const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");

const prisma = new PrismaClient();

const USER_EMAIL = "tobias.doehring@vfa-interlift.de";

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function ensureTraining({
  code,
  title,
  date,
  endDate,
  location,
  instructor,
  description,
  creditsAward,
  certificateKind,
}) {
  const existing = await prisma.training.findFirst({
    where: {
      code,
      title,
      date: new Date(date),
    },
  });

  if (existing) return existing;

  return prisma.training.create({
    data: {
      id: id("trn"),
      code,
      title,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location,
      instructor,
      description,
      creditsAward,
      certificateKind,
    },
  });
}

async function ensureEnrollment({ userId, trainingId, passed }) {
  return prisma.enrollment.upsert({
    where: {
      userId_trainingId: {
        userId,
        trainingId,
      },
    },
    update: {
      status: "CERTIFICATE_ISSUED",
      attended: true,
      passed,
      completedAt: new Date(),
    },
    create: {
      id: id("enr"),
      userId,
      trainingId,
      status: "CERTIFICATE_ISSUED",
      attended: true,
      passed,
      completedAt: new Date(),
    },
  });
}

async function ensureCertificate({
  userId,
  trainingId,
  enrollmentId,
  title,
  code,
  certificateKind,
  credits,
}) {
  return prisma.certificate.upsert({
    where: {
      enrollmentId,
    },
    update: {
      title,
      issuedAt: new Date(),
      status: "ISSUED",
      credits,
      code,
      certificateKind,
      pdfUrl: null,
      note: "Test-Zertifikat",
    },
    create: {
      id: id("crt"),
      userId,
      trainingId,
      enrollmentId,
      title,
      issuedAt: new Date(),
      status: "ISSUED",
      credits,
      code,
      certificateKind,
      pdfUrl: null,
      note: "Test-Zertifikat",
    },
  });
}

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: USER_EMAIL.toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error(`User nicht gefunden: ${USER_EMAIL}`);
  }

  const a1Training = await ensureTraining({
    code: "A1",
    title: "Grundkurs A1",
    date: "2026-05-05T09:00:00.000Z",
    endDate: "2026-05-07T16:00:00.000Z",
    location: "Kiedrich",
    instructor: "Robert Makarun | Nikolai Thoma",
    description:
      "Sicherheitstechnische Grundlagen, technische Grundlagen zu Aufzugssystemen, sicherheitstechnische Bauteile, mechanische Bauteile und Elektrotechnik.",
    creditsAward: 150,
    certificateKind: "ATTENDANCE_CONFIRMATION",
  });

  const a2Training = await ensureTraining({
    code: "A2",
    title: "VDI 2168 Kategorie A",
    date: "2026-05-05T09:00:00.000Z",
    endDate: "2026-05-07T16:00:00.000Z",
    location: "Kiedrich",
    instructor: "Robert Makarun | Nikolai Thoma",
    description:
      "Schulung zur Qualifizierung von Personal für Aufzüge nach VDI 2168.",
    creditsAward: 150,
    certificateKind: "VDI_CERTIFICATE",
  });

  const a1Enrollment = await ensureEnrollment({
    userId: user.id,
    trainingId: a1Training.id,
    passed: false,
  });

  const a2Enrollment = await ensureEnrollment({
    userId: user.id,
    trainingId: a2Training.id,
    passed: true,
  });

  const a1Certificate = await ensureCertificate({
    userId: user.id,
    trainingId: a1Training.id,
    enrollmentId: a1Enrollment.id,
    title: "Teilnahmebestätigung Grundkurs A1",
    code: "A1",
    certificateKind: "ATTENDANCE_CONFIRMATION",
    credits: 150,
  });

  const a2Certificate = await ensureCertificate({
    userId: user.id,
    trainingId: a2Training.id,
    enrollmentId: a2Enrollment.id,
    title: "VDI 2168 Zertifikat Kategorie A",
    code: "A2",
    certificateKind: "VDI_CERTIFICATE",
    credits: 150,
  });

  console.log("Test-Zertifikate angelegt/aktualisiert:");
  console.log({
    user: user.email,
    a1CertificateId: a1Certificate.id,
    a2CertificateId: a2Certificate.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
