import { NextResponse } from "next/server";
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
      creditsTotal: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          certificates: true,
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
      creditsTotal: user.creditsTotal,
      enrollmentsCount: user._count.enrollments,
      certificatesCount: user._count.certificates,
      createdAt: user.createdAt,
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

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    deletedUserId: user.id,
    deletedEmail: user.email,
  });
}