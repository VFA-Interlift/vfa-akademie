import { Resend } from "resend";

// Absender. Standard ist die Resend-Sandbox (funktioniert nur an verifizierte
// Adressen). Nach Verifikation der Domain vfa-akademie.de in Vercel die Env
// MAIL_FROM auf "VFA-Akademie <info@vfa-akademie.de>" setzen – greift ohne Deploy.
const FROM = process.env.MAIL_FROM || "VFA-Akademie <onboarding@resend.dev>";

// Antworten sollen ins Firmenpostfach gehen, auch wenn von @vfa-akademie.de
// gesendet wird. Per Env REPLY_TO überschreibbar.
const REPLY_TO = process.env.REPLY_TO || "info@vfa-interlift.de";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Passwort zurücksetzen – VFA-Akademie",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:32px"></div>

        <h1 style="margin:0 0 8px;font-size:28px;font-weight:400;color:#007873;text-transform:uppercase;letter-spacing:0.02em">
          Passwort zurücksetzen
        </h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Wir haben eine Anfrage erhalten, das Passwort für dein VFA-Akademie-Konto
          zurückzusetzen. Klicke auf den Button, um ein neues Passwort festzulegen.
        </p>

        <a
          href="${resetUrl}"
          style="display:inline-block;padding:12px 28px;background:#007873;color:#ffffff;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:999px"
        >
          Passwort zurücksetzen
        </a>

        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#555555">
          Der Link ist <strong>1 Stunde</strong> gültig. Falls du diese Anfrage
          nicht gestellt hast, kannst du diese E-Mail ignorieren.
        </p>

        <div style="margin-top:32px;padding-top:18px;border-top:1px solid #E6E6E6;font-size:13px;color:#555555">
          VFA-Akademie &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.
        </div>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendFeedbackEmail(params: {
  fromUserEmail: string;
  fromUserName?: string | null;
  category: string;
  message: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.FEEDBACK_EMAIL || "info@vfa-interlift.de";

  const name = params.fromUserName?.trim() || "—";

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: params.fromUserEmail,
    subject: `Feedback (${params.category}) – VFA-Akademie App`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:24px"></div>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#007873">Neues Feedback</h1>
        <p style="margin:0 0 6px;font-size:14px;color:#555555"><strong>Kategorie:</strong> ${escapeHtml(params.category)}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#555555"><strong>Von:</strong> ${escapeHtml(name)} (${escapeHtml(params.fromUserEmail)})</p>
        <div style="margin-top:16px;padding:16px;background:#F6F6F4;border:1px solid #E6E6E6;border-radius:8px;font-size:15px;line-height:1.6;color:#1F1F1F;white-space:pre-wrap">${escapeHtml(params.message)}</div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6E6E6;font-size:13px;color:#888888">
          Antworten geht direkt per „Antworten" an ${escapeHtml(params.fromUserEmail)}.
        </div>
      </div>
    `,
  });
}

export async function sendTrainingReminderEmail(params: {
  to: string;
  name?: string | null;
  trainingTitle: string;
  dateText: string;
  location?: string | null;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const greetingName = params.name?.trim() ? ` ${params.name.trim()}` : "";

  await resend.emails.send({
    from: FROM,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Erinnerung: ${params.trainingTitle} steht an`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:32px"></div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:#007873;text-transform:uppercase;letter-spacing:0.02em">
          Deine Schulung steht an
        </h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333333">
          Hallo${escapeHtml(greetingName)}, hier eine Erinnerung an deine bevorstehende Schulung:
        </p>
        <div style="margin:0 0 20px;padding:16px;background:#F6F6F4;border:1px solid #E6E6E6;border-radius:8px">
          <div style="font-size:18px;font-weight:800;color:#1F1F1F">${escapeHtml(params.trainingTitle)}</div>
          <div style="margin-top:6px;font-size:15px;color:#555555">📅 ${escapeHtml(params.dateText)}</div>
          ${params.location ? `<div style="margin-top:4px;font-size:15px;color:#555555">📍 ${escapeHtml(params.location)}</div>` : ""}
        </div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#555555">
          Wir freuen uns auf dich! Erinnerungen kannst du in der App unter
          „Einstellungen → Benachrichtigungen" abschalten.
        </p>
        <div style="margin-top:32px;padding-top:18px;border-top:1px solid #E6E6E6;font-size:13px;color:#555555">
          VFA-Akademie &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.
        </div>
      </div>
    `,
  });
}
