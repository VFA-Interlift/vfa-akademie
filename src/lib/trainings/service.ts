import { prisma } from "@/lib/prisma";

export type MyTrainingItem = {
  id: string;
  title: string;
  date: Date;
  endDate: Date | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  status: string;
};

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
        in: ["PENDING", "CONFIRMED", "ATTENDED"],
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

  return enrollments.map((enrollment) => ({
    id: enrollment.training.id,
    title: enrollment.training.title,
    date: enrollment.training.date,
    endDate: enrollment.training.endDate,
    location: enrollment.training.location,
    instructor: enrollment.training.instructor,
    description: enrollment.training.description,
    creditsAward: enrollment.training.creditsAward,
    status: enrollment.status,
  }));
}