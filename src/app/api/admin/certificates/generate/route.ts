import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zertifikateAusstellen } from "@/lib/certificates/ausstellen";
import { formatCertificateKind } from "@/lib/certificates/templates";
import { sendCertificateReadyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function deny(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;

  if (!adminEmail) {
    return { ok: false as const, res: deny(401, "UNAUTHENTICATED") };
  }

  const admin = await prisma.user.findUnique({
    where: {
      email: adminEmail.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { ok: false as const, res: deny(403, "FORBIDDEN") };
  }

  return { ok: true as const, admin };
}

export async function POST() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return gate.res;
  }

  const now = new Date();

  try {
    const { empfaenger: alleEmpfaenger, ...zahlen } = await zertifikateAusstellen(now, { adminId: gate.admin.id });

    // Bereit-Mails wie beim nächtlichen Lauf (api/cron/certificates): Wer sein
    // Zertifikat über den Admin-Knopf bekam, erfuhr vorher nichts davon, und
    // der Cron holt die Mail nicht nach (Befund f06-4, 05.09.2026). Ein
    // Mailfehler darf die ausgestellten Zertifikate nicht berühren.
    let benachrichtigt = 0;
    let benachrichtigungFehler = 0;
    for (const empfaenger of alleEmpfaenger) {
      try {
        await sendCertificateReadyEmail({
          to: empfaenger.to,
          name: empfaenger.name,
          trainingTitle: empfaenger.trainingTitle,
          artLabel: formatCertificateKind(empfaenger.certificateKind),
          credits: empfaenger.credits,
        });
        benachrichtigt += 1;
      } catch (mailError) {
        benachrichtigungFehler += 1;
        console.error("CERTIFICATE_READY_MAIL_ERROR", empfaenger.to, mailError);
      }
    }

    return NextResponse.json({
      ok: true,
      ...zahlen,
      benachrichtigt,
      benachrichtigungFehler,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "CERTIFICATE_GENERATION_FAILED",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}