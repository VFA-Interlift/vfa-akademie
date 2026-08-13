import type { CertificateKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCertificateKind } from "@/lib/certificates/templates";

export type MyTrainingItem = {
  id: string;
  title: string;
  code: string | null;
  certificateKind: CertificateKind | null;
  certificateKindLabel: string;
  date: Date;
  endDate: Date | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  status: string;
  /** Gesetzt, wenn der Kurs abgesagt wurde — die Anzeige sagt es dazu. */
  cancelledAt?: Date | null;
  /** Nur bei vergangenen Teilnahmen gesetzt, wenn ein Zertifikat ausgestellt ist. */
  certificateId?: string | null;
};

function heuteBeginn() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Vergangene Teilnahmen — auch die aus dem einmaligen Cobra-Import. Ohne diese
 * Liste wäre die Historie nur über „Meine Zertifikate" sichtbar, und Kurse ohne
 * Zertifikat (etwa YLD) gar nicht.
 */
export async function getMyPastTrainings(email: string): Promise<MyTrainingItem[]> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });

  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      training: {
        OR: [
          { endDate: { lt: heuteBeginn() } },
          { endDate: null, date: { lt: heuteBeginn() } },
        ],
      },
    },
    orderBy: { training: { date: "desc" } },
    select: {
      status: true,
      certificate: { select: { id: true, status: true } },
      training: {
        select: {
          id: true,
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

  return enrollments.map((e) => ({
    id: e.training.id,
    title: e.training.title,
    code: e.training.code,
    certificateKind: e.training.certificateKind,
    certificateKindLabel: formatCertificateKind(e.training.certificateKind),
    date: e.training.date,
    endDate: e.training.endDate,
    location: e.training.location,
    instructor: e.training.instructor,
    description: e.training.description,
    creditsAward: e.training.creditsAward,
    status: e.status,
    certificateId: e.certificate && e.certificate.status === "ISSUED" ? e.certificate.id : null,
  }));
}

export async function getMyTrainings(email: string): Promise<MyTrainingItem[]> {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
    },
  });

  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      status: {
        in: ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"],
      },
      // endDate zaehlt mit: Ein laufender Mehrtageskurs rutschte sonst ab
      // Tag 2 in die Vergangenheit (Ultracode-Befund 13.08.2026).
      training: {
        OR: [
          { endDate: { gte: heuteBeginn() } },
          { endDate: null, date: { gte: heuteBeginn() } },
        ],
      },
    },
    orderBy: {
      training: {
        date: "asc",
      },
    },
    select: {
      status: true,
      training: {
        select: {
          id: true,
          title: true,
          code: true,
          certificateKind: true,
          date: true,
          endDate: true,
          location: true,
          instructor: true,
          description: true,
          creditsAward: true,
          cancelledAt: true,
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.training.id,
    title: enrollment.training.title,
    code: enrollment.training.code,
    certificateKind: enrollment.training.certificateKind,
    certificateKindLabel: formatCertificateKind(enrollment.training.certificateKind),
    date: enrollment.training.date,
    endDate: enrollment.training.endDate,
    location: enrollment.training.location,
    instructor: enrollment.training.instructor,
    description: enrollment.training.description,
    creditsAward: enrollment.training.creditsAward,
    status: enrollment.status,
    cancelledAt: enrollment.training.cancelledAt,
  }));
}