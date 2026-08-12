import { NextResponse } from "next/server";
import { zertifikateAusstellen } from "@/lib/certificates/ausstellen";
import { formatCertificateKind } from "@/lib/certificates/templates";
import { sendCertificateReadyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { ok: false as const, response: fail("CRON_SECRET_NOT_CONFIGURED", 500) };
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return { ok: false as const, response: fail("UNAUTHORIZED", 401) };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  const gate = isAuthorized(req);

  if (!gate.ok) {
    return gate.response;
  }

  const now = new Date();

  try {
    const result = await zertifikateAusstellen(now);

    // Benachrichtigungen nach der Ausstellung. Ein Mailfehler darf die bereits
    // ausgestellten Zertifikate nicht berühren.
    let benachrichtigt = 0;
    let benachrichtigungFehler = 0;

    for (const empfaenger of result.empfaenger) {
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

    const { empfaenger: _unbenutzt, ...zahlen } = result;

    return NextResponse.json({
      ok: true,
      ...zahlen,
      benachrichtigt,
      benachrichtigungFehler,
      triggeredAt: now.toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: "CERTIFICATE_GENERATION_FAILED", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
