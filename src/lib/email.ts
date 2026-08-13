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

/**
 * Bestätigungsmail beim ADRESSWECHSEL eines bestehenden Kontos — bewusst
 * getrennt von der Registrierungs-Willkommensmail: Der Empfänger der neuen
 * Adresse muss erkennen, dass hier ein bestehendes Konto umziehen will, nicht
 * dass er sich registriert hätte (Gegenprüfung 13.08.2026).
 */
export async function sendEmailChangeEmail(
  to: string,
  verifyUrl: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Neue Anmeldeadresse bestätigen – VFA-Akademie",
    text: `Neue Anmeldeadresse bestätigen

Für ein bestehendes VFA-Akademie-Konto wurde diese Adresse als neue
Anmeldeadresse angegeben. Bestätige den Wechsel über diesen Link
(24 Stunden gültig):

${verifyUrl}

Erst mit der Bestätigung zieht das Konto um. Warst du das nicht, kannst du
diese E-Mail ignorieren — dann bleibt alles beim Alten.

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:32px"></div>

        <h1 style="margin:0 0 8px;font-size:28px;font-weight:400;color:#007873;text-transform:uppercase;letter-spacing:0.02em">
          Neue Anmeldeadresse bestätigen
        </h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Für ein bestehendes VFA-Akademie-Konto wurde diese Adresse als neue
          Anmeldeadresse angegeben. Bestätige den Wechsel, damit das Konto
          künftig über diese Adresse läuft.
        </p>

        <a
          href="${verifyUrl}"
          style="display:inline-block;padding:12px 28px;background:#007873;color:#ffffff;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:999px"
        >
          Wechsel bestätigen
        </a>

        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#555555">
          Der Link ist <strong>24 Stunden</strong> gültig. Warst du das nicht,
          ignoriere diese E-Mail einfach — dann bleibt alles beim Alten.
        </p>

        <div style="margin-top:32px;padding-top:18px;border-top:1px solid #E6E6E6;font-size:13px;color:#555555">
          VFA-Akademie &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.
        </div>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Bitte bestätige deine E-Mail-Adresse – VFA-Akademie",
    text: `Willkommen bei der VFA-Akademie

Bitte bestätige deine E-Mail-Adresse, damit wir dein Konto mit deinen
Schulungsanmeldungen verbinden können. Öffne dazu diesen Link (24 Stunden gültig):

${verifyUrl}

Hast du dich nicht registriert, kannst du diese E-Mail ignorieren. Ohne
Bestätigung passiert nichts.

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:32px"></div>

        <h1 style="margin:0 0 8px;font-size:28px;font-weight:400;color:#007873;text-transform:uppercase;letter-spacing:0.02em">
          E-Mail bestätigen
        </h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Willkommen bei der VFA-Akademie. Bitte bestätige deine E-Mail-Adresse,
          damit wir dein Konto mit deinen Schulungsanmeldungen verbinden können.
        </p>

        <a
          href="${verifyUrl}"
          style="display:inline-block;padding:12px 28px;background:#007873;color:#ffffff;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:999px"
        >
          E-Mail bestätigen
        </a>

        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#555555">
          Der Link ist <strong>24 Stunden</strong> gültig. Hast du dich nicht
          registriert, ignoriere diese E-Mail einfach — ohne Bestätigung passiert
          nichts.
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

export async function sendNewRegistrationNotificationEmail(params: {
  name: string;
  email: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.REGISTRATION_NOTIFY_EMAIL || "info@vfa-interlift.de";

  const name = params.name.trim() || "—";
  const registeredAt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date());

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: params.email,
    subject: `Neue Registrierung: ${name} – VFA-Akademie App`,
    text: `Neue Registrierung – VFA-Akademie App

Name: ${name}
E-Mail: ${params.email}
Registriert am: ${registeredAt} Uhr

Diese E-Mail wurde automatisch generiert.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:24px"></div>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#007873">Neue Registrierung</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333">
          Soeben hat sich ein neuer Nutzer in der VFA-Akademie App registriert.
        </p>
        <div style="padding:16px;background:#F6F6F4;border:1px solid #E6E6E6;border-radius:8px;font-size:15px;line-height:1.8;color:#1F1F1F">
          <div><strong>Name:</strong> ${escapeHtml(name)}</div>
          <div><strong>E-Mail:</strong> ${escapeHtml(params.email)}</div>
          <div><strong>Registriert am:</strong> ${escapeHtml(registeredAt)} Uhr</div>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6E6E6;font-size:13px;color:#888888">
          VFA-Akademie &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.
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


/**
 * Meldung an alle Angemeldeten, wenn ein Kurs abgesagt wird. Vorher erfuhr
 * das niemand — der Kurs stand einfach weiter in der App (Ultracode-Befund
 * 13.08.2026). Bewusst OHNE Abmelde-Rücksicht: Eine Absage ist keine
 * Werbung, sie muss jeden erreichen.
 */
export async function sendTrainingCancelledEmail(params: {
  to: string;
  name?: string | null;
  trainingTitle: string;
  dateText: string;
  from?: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const greetingName = params.name?.trim() ? ` ${params.name.trim()}` : "";

  await resend.emails.send({
    from: params.from || FROM,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Abgesagt: ${params.trainingTitle}`,
    text: `Deine Schulung wurde abgesagt

Hallo${greetingName},

leider müssen wir die folgende Schulung absagen:

${params.trainingTitle}
Geplant war: ${params.dateText}

Bitte plane den Termin nicht weiter ein. Zu Ersatzterminen melden wir uns; bei Fragen erreichst du uns unter info@vfa-interlift.de.

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f1f1f;max-width:560px">
<h2 style="color:#b00020;font-size:18px">Deine Schulung wurde abgesagt</h2>
<p>Hallo${escapeHtml(greetingName)},</p>
<p>leider m&uuml;ssen wir die folgende Schulung absagen:</p>
<p style="padding:12px 16px;background:#f7f7f4;border-left:4px solid #b00020"><strong>${escapeHtml(params.trainingTitle)}</strong><br>Geplant war: ${escapeHtml(params.dateText)}</p>
<p>Bitte plane den Termin nicht weiter ein. Zu Ersatzterminen melden wir uns; bei Fragen erreichst du uns unter <a href="mailto:info@vfa-interlift.de">info@vfa-interlift.de</a>.</p>
<p style="color:#888;font-size:12px">VFA-Akademie &middot; Diese E-Mail wurde automatisch generiert.</p>
</div>`,
  });
}

/**
 * Meldung, sobald ein Zertifikat oder eine Teilnahmebestätigung bereitliegt.
 * Vorher erfuhr das niemand — der Teilnehmer musste von selbst nachsehen.
 */
export async function sendCertificateReadyEmail(params: {
  to: string;
  name?: string | null;
  trainingTitle: string;
  artLabel: string;
  credits: number;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const anrede = params.name?.trim() ? ` ${params.name.trim()}` : "";
  const creditsSatz =
    params.credits > 0
      ? ` Dir wurden ${params.credits} Credits gutgeschrieben.`
      : "";

  await resend.emails.send({
    from: FROM,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${params.artLabel} bereit: ${params.trainingTitle}`,
    text: `Deine ${params.artLabel} liegt bereit

Hallo${anrede}, für "${params.trainingTitle}" ist deine ${params.artLabel} fertig.${creditsSatz}

Du findest sie in der App unter "Meine Zertifikate":
${APP_URL}/meine-zertifikate

VFA-Akademie · Diese E-Mail wurde automatisch generiert.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:28px"></div>

        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#1F1F1F;letter-spacing:-0.01em">
          Deine ${escapeHtml(params.artLabel)} liegt bereit
        </h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#444444">
          Hallo${escapeHtml(anrede)}, für <strong>${escapeHtml(params.trainingTitle)}</strong>
          ist deine ${escapeHtml(params.artLabel)} fertig.${escapeHtml(creditsSatz)}
        </p>

        <a
          href="${APP_URL}/meine-zertifikate"
          style="display:inline-block;padding:13px 30px;background:#007873;color:#ffffff;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.06em;text-decoration:none;border-radius:999px"
        >
          Jetzt herunterladen
        </a>

        <div style="margin-top:32px;padding-top:18px;border-top:1px solid #E6E6E6;font-size:13px;color:#555555">
          VFA-Akademie &nbsp;·&nbsp; Diese E-Mail wurde automatisch generiert.
        </div>
      </div>
    `,
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

/**
 * Rueckmeldung aus der App-Testrunde. Geht an dieselbe Adresse wie das
 * allgemeine Feedback, ist aber im Betreff als Testrunde erkennbar.
 */
export async function sendAppTestFeedbackEmail(params: {
  fromUserEmail: string;
  fromUserName?: string | null;
  overallRating: number;
  antworten: { frage: string; antwort: string | number | string[] | undefined }[];
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.FEEDBACK_EMAIL || "info@vfa-interlift.de";

  const name = params.fromUserName?.trim() || "—";

  const alsText = (wert: string | number | string[] | undefined): string => {
    if (wert === undefined) return "— (keine Angabe)";
    if (Array.isArray(wert)) return wert.join(", ");
    if (typeof wert === "number") return `${wert} von 5`;
    return wert;
  };

  const zeilenText = params.antworten
    .map((a) => `${a.frage}\n${alsText(a.antwort)}`)
    .join("\n\n");

  const zeilenHtml = params.antworten
    .map(
      (a) => `
        <div style="margin-bottom:14px">
          <div style="font-size:13px;color:#777777">${escapeHtml(a.frage)}</div>
          <div style="font-size:15px;color:#1F1F1F;white-space:pre-wrap">${escapeHtml(alsText(a.antwort))}</div>
        </div>`
    )
    .join("");

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: params.fromUserEmail,
    subject: `Testrunde: ${name} bewertet die App mit ${params.overallRating} von 5`,
    text: `Rueckmeldung aus der App-Testrunde

Von: ${name} (${params.fromUserEmail})
Gesamtzufriedenheit: ${params.overallRating} von 5

${zeilenText}

Antworten geht direkt per „Antworten" an ${params.fromUserEmail}.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1F1F1F">
        <div style="height:5px;background:#FFC100;margin-bottom:24px"></div>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#007873">Rückmeldung aus der Testrunde</h1>
        <p style="margin:0 0 6px;font-size:14px;color:#555555"><strong>Von:</strong> ${escapeHtml(name)} (${escapeHtml(params.fromUserEmail)})</p>
        <p style="margin:0 0 20px;font-size:14px;color:#555555"><strong>Gesamtzufriedenheit:</strong> ${params.overallRating} von 5</p>
        <div style="padding:16px;background:#F6F6F4;border:1px solid #E6E6E6;border-radius:8px">${zeilenHtml}</div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6E6E6;font-size:13px;color:#888888">
          Antworten geht direkt per „Antworten" an ${escapeHtml(params.fromUserEmail)}.
        </div>
      </div>
    `,
  });
}
