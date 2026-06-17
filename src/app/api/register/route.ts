import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseGermanDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValid ? date : null;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: null,
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const birthDateStr = String(body.birthDate ?? "").trim();

    if (!email || !password || !name || !birthDateStr) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte alle Felder ausfüllen.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte eine gültige E-Mail-Adresse eingeben.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error: "Passwort muss mindestens 8 Zeichen haben.",
        },
        { status: 400 }
      );
    }

    const birthDate = parseGermanDate(birthDateStr);

    if (!birthDate) {
      return NextResponse.json(
        {
          ok: false,
          error: "Geburtsdatum bitte als TT.MM.JJJJ eingeben.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: "E-Mail ist bereits registriert.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { firstName, lastName } = splitName(name);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        firstName,
        lastName,
        birthDate,
      },
      select: { id: true },
    });

    // Auto-enroll from matching Cobra participant records (email sync)
    try {
      const cobraMatches = await prisma.cobraTrainingParticipant.findMany({
        where: { email, trainingId: { not: null } },
        select: { trainingId: true },
      });
      for (const match of cobraMatches) {
        if (!match.trainingId) continue;
        await prisma.enrollment.upsert({
          where: { userId_trainingId: { userId: newUser.id, trainingId: match.trainingId } },
          create: { userId: newUser.id, trainingId: match.trainingId, status: "CONFIRMED" },
          update: {},
        });
      }
    } catch {
      // Auto-enrollment failure does not block registration
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Serverfehler: ${
                error instanceof Error ? error.message : String(error)
              }`
            : "Serverfehler.",
      },
      { status: 500 }
    );
  }
}