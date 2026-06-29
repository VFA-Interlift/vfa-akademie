import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Temporäre Diagnose: prüft, warum einem Dozenten keine Schulungen angezeigt
// werden. Admin-only. Aufruf im Browser (als Admin eingeloggt):
//   /api/admin/debug/dozent?email=<dozent-email>
// Nach der Analyse wieder entfernen.

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstructorMatch(
  instructorField: string | null,
  firstName: string | null,
  lastName: string | null,
  fullName: string | null
): boolean {
  if (!instructorField) return false;
  const field = normalize(instructorField);
  if (firstName && lastName) {
    if (field.includes(normalize(firstName)) && field.includes(normalize(lastName))) return true;
  }
  if (fullName) {
    const parts = normalize(fullName).split(" ").filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => field.includes(p))) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email.trim().toLowerCase() },
        select: { role: true },
      })
    : null;
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true, name: true, isInstructor: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND", email }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = await prisma.training.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    select: { id: true, title: true, code: true, date: true, instructor: true },
  });

  return NextResponse.json({
    user,
    today: today.toISOString(),
    upcomingCount: upcoming.length,
    trainings: upcoming.map((t) => ({
      code: t.code,
      title: t.title,
      date: t.date,
      instructor: t.instructor,
      instructorNormalized: t.instructor ? normalize(t.instructor) : null,
      matches: isInstructorMatch(t.instructor, user.firstName, user.lastName, user.name),
    })),
    nameCheck: {
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      normalizedFirst: user.firstName ? normalize(user.firstName) : null,
      normalizedLast: user.lastName ? normalize(user.lastName) : null,
    },
  });
}
