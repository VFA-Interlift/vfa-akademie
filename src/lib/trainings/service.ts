import { prisma } from "@/lib/prisma";

export type MyTrainingItem = {
  id: string;
  title: string;
  date: Date;
  creditsAward: number;
};

export async function getMyTrainings(email: string): Promise<MyTrainingItem[]> {
  // Übergangslösung:
  // Aktuell noch lokal aus Prisma.
  // Später hier Cobra-API nach E-Mail abfragen.
  void email;

  return prisma.training.findMany({
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      title: true,
      date: true,
      creditsAward: true,
    },
  });
}