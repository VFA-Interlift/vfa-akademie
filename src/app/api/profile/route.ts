import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseGermanDate(value: string): Date | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Nicht eingeloggt." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const currentEmail = session.user.email.trim().toLowerCase();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "E-Mail ist Pflicht." },
        { status: 400 }
      );
    }

    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);

    const fallbackName = cleanString(body.name);
    const fullName =
      firstName || lastName
        ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
        : fallbackName;

    const birthDateStr =
      typeof body.birthDate === "string" ? body.birthDate.trim() : "";

    const birthDate = birthDateStr ? parseGermanDate(birthDateStr) : null;

    if (birthDateStr && !birthDate) {
      return NextResponse.json(
        { ok: false, error: "Geburtsdatum muss TT.MM.JJJJ sein." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email: currentEmail,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "User nicht gefunden." },
        { status: 404 }
      );
    }

    if (email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { ok: false, error: "Diese E-Mail ist bereits vergeben." },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        email,
        name: fullName,
        firstName,
        lastName,
        birthDate,
        gender: cleanString(body.gender),
        phone: cleanString(body.phone),

        company: cleanString(body.company),
        companyAddress: cleanString(body.companyAddress),
        companyStreet: cleanString(body.companyStreet),
        companyZip: cleanString(body.companyZip),
        companyCity: cleanString(body.companyCity),
        companyCountry: cleanString(body.companyCountry),
        position: cleanString(body.position),
      },
    });

    return NextResponse.json({
      ok: true,
      emailChanged: email !== currentUser.email,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Serverfehler." },
      { status: 500 }
    );
  }
}