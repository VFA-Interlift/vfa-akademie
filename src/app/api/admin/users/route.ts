import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status }
  );
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { ok: false as const, res: fail("UNAUTHENTICATED", 401) };
  }

  const me = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });

  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: fail("FORBIDDEN", 403) };
  }

  return { ok: true as const, adminUser: me };
}

export async function GET() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      company: true,
      role: true,
      isInstructor: true,
      creditsTotal: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          enrollments: true,
          // Nur gültige Zertifikate zählen, wie die Kachel auf der
          // Admin-Startseite (Befund f12-8, 05.09.2026).
          certificates: { where: { status: "ISSUED" } },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.name ||
        "",
      company: user.company ?? "",
      role: user.role,
      isInstructor: user.isInstructor,
      creditsTotal: user.creditsTotal,
      enrollmentsCount: user._count.enrollments,
      certificatesCount: user._count.certificates,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })),
  });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const userId =
    typeof body === "object" &&
    body !== null &&
    "userId" in body &&
    typeof body.userId === "string"
      ? body.userId.trim()
      : "";

  if (!userId) {
    return fail("INVALID_USER_ID", 400);
  }

  if (userId === gate.adminUser.id) {
    return fail("CANNOT_DELETE_SELF", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return fail("USER_NOT_FOUND", 404);
  }

  // Dateien VOR dem Löschen einsammeln (die DB-Zeilen reißt die Kaskade mit),
  // die Blobs aber erst NACH dem erfolgreichen DB-Löschen entfernen — wie bei
  // der Kontolöschung durch den Nutzer (api/me/delete). Vorher blieben
  // Zertifikat-PDFs und Nachweise verwaist im Speicher (Befund f12-26, 05.09.2026).
  const [dokumente, zertifikate] = await Promise.all([
    prisma.userDocument.findMany({ where: { userId: user.id }, select: { fileUrl: true } }),
    prisma.certificate.findMany({ where: { userId: user.id, pdfUrl: { not: null } }, select: { pdfUrl: true } }),
  ]);
  const dateien = [
    ...dokumente.map((d) => d.fileUrl),
    ...zertifikate.map((z) => z.pdfUrl).filter((u): u is string => !!u),
  ];

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  if (dateien.length > 0) {
    try {
      await del(dateien);
    } catch (fehler) {
      console.error("ADMIN_USER_DELETE_BLOB_ERROR", user.id, fehler);
    }
  }

  return NextResponse.json({
    ok: true,
    deletedUserId: user.id,
    deletedEmail: user.email,
  });
}