import { prisma } from "@/lib/prisma";

export type MyTrainingItem = {
  id: string;
  title: string;
  date: Date;
  creditsAward: number;
};

export async function getMyTrainings(email: string): Promise<MyTrainingItem[]> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });

  if (!user) return [];

  const badges = await prisma.badge.findMany({
    where: { userId: user.id },
    orderBy: {
      issuedAt: "desc",
    },
    select: {
      training: {
        select: {
          id: true,
          title: true,
          date: true,
          creditsAward: true,
        },
      },
    },
  });

  return badges.map((b) => ({
    id: b.training.id,
    title: b.training.title,
    date: b.training.date,
    creditsAward: b.training.creditsAward,
  }));
}