import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { extractKurscode, uploadInboundAttachments } from "@/lib/resend-inbound";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resend-Inbound-Webhook: empfängt Orga-/Bestätigungsmails, die per CC an die
 * Akademie-Inbound-Adresse geschickt werden, ordnet sie über den Kurscode im
 * Betreff einer Schulung zu und legt Text + Bildanhänge ab. Angezeigt wird das
 * im Dozentenbereich (Tab „Infos").
 *
 * Der Webhook selbst liefert nur Metadaten (`email.received`). Body und Anhänge
 * werden per Resend-Receiving-API nachgeladen.
 *
 * Auth: Svix-Signatur (`svix-id`/`svix-timestamp`/`svix-signature`) gegen
 * RESEND_INBOUND_WEBHOOK_SECRET.
 */

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

type ReceivedEvent = {
  type: string;
  data: { email_id?: string; subject?: string };
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) return fail("WEBHOOK_SECRET_NOT_CONFIGURED", 500);

  // Rohbytes für die Svix-Verifikation (nicht req.json()).
  const rawBody = await req.text();

  let event: ReceivedEvent;
  try {
    event = new Webhook(secret).verify(rawBody, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ReceivedEvent;
  } catch {
    return fail("INVALID_SIGNATURE", 401);
  }

  if (event.type !== "email.received") {
    // Andere Events quittieren wir freundlich, ohne etwas zu tun.
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const emailId = event.data.email_id?.trim();
  if (!emailId) return fail("MISSING_EMAIL_ID");

  // Body (inkl. Betreff/Text) per Resend-Receiving-API laden – brauchen wir für
  // Anzeige und für das Kurscode-Matching (Code steht im Betreff und/oder Body).
  const resend = new Resend(process.env.RESEND_API_KEY);
  const emailRes = await resend.emails.receiving.get(emailId);
  if (emailRes.error || !emailRes.data) return fail("FETCH_EMAIL_FAILED", 502);
  const email = emailRes.data;

  const subject = email.subject?.trim() || event.data.subject?.trim() || "";
  const body = email.text ?? "";

  // Die Inbound-Adresse ist von außen erreichbar — ohne Absenderprüfung würde
  // jede Fremdmail mit passendem Kurscode im Betreff als vertrauenswürdige
  // Orga-Info im Dozentenbereich angezeigt. Nur Absender aus dem eigenen Haus
  // verarbeiten; Fremdes still quittieren (200, sonst stellt Resend erneut zu)
  // und nur protokollieren (20.08.2026).
  const fromRaw = email.from ?? "";
  const fromAdresse = (fromRaw.match(/<([^>]+)>/)?.[1] ?? fromRaw).trim().toLowerCase();
  if (!fromAdresse.endsWith("@vfa-interlift.de")) {
    console.warn("RESEND_INBOUND_FREMDER_ABSENDER", { from: fromRaw, subject });
    return NextResponse.json({ ok: true, ignored: "FREMDER_ABSENDER" });
  }

  // Kurscode aus Betreff + Body gegen bekannte Training-Codes matchen.
  const trainings = await prisma.training.findMany({
    where: { code: { not: null } },
    select: { id: true, code: true },
  });
  const kurscode = extractKurscode(
    subject,
    body,
    trainings.map((t) => t.code as string)
  );
  // Ohne Kurscode gibt es nichts zuzuordnen — aber mit 422 stellte Resend die
  // Mail immer wieder zu, jedes Mal mit erneutem Nachladen und derselben
  // Ablehnung. Deshalb wie beim Fremdabsender: quittieren und protokollieren
  // (Befund 05.09.2026).
  if (!kurscode) {
    console.warn("RESEND_INBOUND_OHNE_KURSCODE", { from: fromRaw, subject });
    return NextResponse.json({ ok: true, ignored: "NO_KURSCODE_FOUND" });
  }

  const match = trainings.find((t) => (t.code ?? "").toUpperCase() === kurscode);

  // Anhänge laden (Bilder inline, PDFs & Co. als Download) und in Blob ablegen.
  const attRes = await resend.emails.receiving.attachments.list({ emailId });
  const attachments = attRes.data?.data?.length
    ? await uploadInboundAttachments(emailId, kurscode, attRes.data.data)
    : [];

  await prisma.kursOrgaMail.upsert({
    where: { resendEmailId: emailId },
    create: {
      resendEmailId: emailId,
      kurscode,
      trainingId: match?.id ?? null,
      subject: email.subject ?? subject ?? null,
      fromAddress: email.from ?? null,
      text: email.text ?? null,
      html: email.html ?? null,
      attachments,
      receivedAt: email.created_at ? new Date(email.created_at) : new Date(),
    },
    update: {
      kurscode,
      trainingId: match?.id ?? null,
      subject: email.subject ?? subject ?? null,
      fromAddress: email.from ?? null,
      text: email.text ?? null,
      html: email.html ?? null,
      attachments,
      receivedAt: email.created_at ? new Date(email.created_at) : new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    kurscode,
    matched: !!match,
    attachments: attachments.length,
  });
}
