import { Resend } from "resend";

// Absender. Standard ist die Resend-Sandbox (funktioniert nur an verifizierte
// Adressen). Nach Verifikation der Domain vfa-akademie.de in Vercel die Env
// MAIL_FROM auf "VFA-Akademie <info@vfa-akademie.de>" setzen – greift ohne Deploy.
const FROM = process.env.MAIL_FROM || "VFA-Akademie <onboarding@resend.dev>";

// Antworten sollen ins Firmenpostfach gehen, auch wenn von @vfa-akademie.de
// gesendet wird. Per Env REPLY_TO überschreibbar.
const REPLY_TO = process.env.REPLY_TO || "info@vfa-interlift.de";

// Basis-URL der App für Buttons/Links in E-Mails.
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://vfa-akademie.vercel.app").replace(/\/$/, "");

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
    text: `Passwort zurücksetzen – VFA-Akademie

Wir haben eine Anfrage erhalten, das Passwort für dein VFA-Akademie-Konto zurückzusetzen.
Öffne diesen Link, um ein neues Passwort festzulegen (1 Stunde gültig):

${resetUrl}

Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
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
    text: `Neues Feedback – VFA-Akademie App

Kategorie: ${params.category}
Von: ${name} (${params.fromUserEmail})

${params.message}

Antworten geht direkt per „Antworten" an ${params.fromUserEmail}.`,
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
  from?: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const greetingName = params.name?.trim() ? ` ${params.name.trim()}` : "";

  await resend.emails.send({
    from: params.from || FROM,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Erinnerung: ${params.trainingTitle} steht an`,
    headers: {
      "List-Unsubscribe": "<mailto:info@vfa-interlift.de?subject=Abmelden%20Erinnerungen>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    text: `Deine Schulung steht an

Hallo${greetingName ? greetingName : ""}, hier eine Erinnerung an deine bevorstehende Schulung:

${params.trainingTitle}
Datum: ${params.dateText}${params.location ? `\nOrt: ${params.location}` : ""}

Erinnerungen kannst du in der App unter „Einstellungen → Benachrichtigungen" abschalten.

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
    html: reminderHtml({
      greetingName: escapeHtml(greetingName),
      trainingTitle: escapeHtml(params.trainingTitle),
      dateText: escapeHtml(params.dateText),
      location: params.location ? escapeHtml(params.location) : null,
    }),
  });
}

/** Hübsches, e-mail-client-sicheres (tabellenbasiertes) Reminder-Template. */
function reminderHtml(p: {
  greetingName: string;
  trainingTitle: string;
  dateText: string;
  location: string | null;
}): string {
  const label = (text: string) =>
    `<div style="font-size:11px;font-weight:800;color:#007873;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">${text}</div>`;

  return `
  <!DOCTYPE html>
  <html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F4F4F2;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Erinnerung: ${p.trainingTitle} am ${p.dateText}${p.location ? ` · ${p.location}` : ""}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F2;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06)">

          <!-- Brand-Header -->
          <tr><td style="background:#007873;padding:24px 32px 20px">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em">VFA-Akademie</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px">Schulungen · Zertifikate · Credits</div>
          </td></tr>
          <tr><td style="height:4px;background:#FFC100;font-size:0;line-height:0">&nbsp;</td></tr>

          <!-- Inhalt -->
          <tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#1F1F1F">
            <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#1F1F1F;letter-spacing:-0.01em">Deine Schulung steht bald an</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#444444">
              Hallo${p.greetingName}, dies ist eine freundliche Erinnerung an deine bevorstehende Schulung.
              Wir freuen uns auf dich!
            </p>

            <!-- Schulungs-Karte -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;border:1px solid #E6E6E6;border-radius:12px">
              <tr><td style="padding:20px 22px">
                ${label("Schulung")}
                <div style="font-size:19px;font-weight:800;color:#007873;line-height:1.25;margin-bottom:16px">${p.trainingTitle}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="padding-right:12px">
                      ${label("Datum")}
                      <div style="font-size:15px;color:#1F1F1F;font-weight:600">${p.dateText}</div>
                    </td>
                    ${p.location ? `<td valign="top" style="padding-left:12px;border-left:1px solid #E6E6E6">
                      ${label("Ort")}
                      <div style="font-size:15px;color:#1F1F1F;font-weight:600">${p.location}</div>
                    </td>` : ""}
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px">
              <tr><td style="border-radius:999px;background:#007873">
                <a href="${APP_URL}/meine-schulungen" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:0.04em;border-radius:999px">Meine Schulungen ansehen</a>
              </td></tr>
            </table>

            <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#777777">
              Erinnerungen kannst du jederzeit in der App unter <strong>Einstellungen → Benachrichtigungen</strong> abschalten.
            </p>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:20px 32px;background:#FAFAF9;border-top:1px solid #ECECEC;font-family:Arial,Helvetica,sans-serif">
            <div style="font-size:13px;font-weight:700;color:#555555">VFA-Akademie</div>
            <div style="font-size:12px;color:#999999;margin-top:2px;line-height:1.5">
              Verband für Aufzugstechnik e.V.<br>
              Diese E-Mail wurde automatisch versendet. Antworten erreichen uns unter ${REPLY_TO}.
            </div>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body></html>`;
}
