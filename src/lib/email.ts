import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// TODO: Nach DNS-Verifikation durch IT auf "VFA-Akademie <info@vfa-akademie.de>" ändern
const FROM = "VFA-Akademie <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
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
