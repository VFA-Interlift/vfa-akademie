import { NextResponse } from "next/server";
import { zertifikateAusstellen } from "@/lib/certificates/ausstellen";
import { formatCertificateKind } from "@/lib/certificates/templates";
import { sendCertificateReadyEmail } from "@/lib/email";
import { cronGeprueft } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
// Viele Teilnehmer heißt viele kleine Transaktionen plus eine Mail je Empfänger;
// am Standardlimit bräche Vercel mitten im Lauf hart ab (Befund 05.09.2026).
export const maxDuration = 300;

export async function GET(req: Request) {
  const gate = cronGeprueft(req);

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
    // Fehlertext nur ins Protokoll: Prisma-Meldungen nennen Tabellen und Hosts.
    console.error("CERTIFICATE_GENERATION_FAILED", error);
    return NextResponse.json(
      { ok: false, error: "CERTIFICATE_GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
