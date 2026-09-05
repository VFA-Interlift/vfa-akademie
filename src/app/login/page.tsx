"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

/**
 * Nur ein eigener, relativer Pfad darf Ziel nach der Anmeldung sein — sonst
 * könnte ein präparierter Link („?callbackUrl=https://…“ oder „//fremd.de“)
 * nach dem Anmelden auf eine fremde Seite führen (Befund f02-1, 05.09.2026).
 */
function sicheresZiel(wert: string | null): string {
  if (wert && /^\/(?![/\\])/.test(wert)) return wert;
  return "/dashboard";
}

export default function LoginPage() {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <PageHeader title="Anmelden" />
        <p style={UNTERTITEL}>Melde dich mit deinem VFA-Akademie-Konto an.</p>

        {/* useSearchParams braucht eine Suspense-Hülle, sonst bricht der Bau. */}
        <Suspense fallback={<div />}>
          <LoginForm />
        </Suspense>

        <p style={FUSSZEILE}>
          Noch kein Konto?{" "}
          <Link href="/register" style={FUSSLINK}>
            Jetzt registrieren
          </Link>
        </p>

        {/* Impressum/Datenschutz stehen im SocialFooter (Root-Layout) —
            die frühere Inline-Zeile stand doppelt darüber (Tobi, 13.08.). */}
      </div>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ziel = sicheresZiel(params.get("callbackUrl"));
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wer schon angemeldet ist, braucht kein Formular (Befund f02-3). Die
  // E-Mail muss dabei sein: Eine geleerte Sitzung (Nutzer gelöscht, siehe
  // lib/auth.ts) gilt sonst als angemeldet und liefe zwischen /login und
  // /dashboard im Kreis.
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) router.replace(ziel);
  }, [status, session?.user?.email, ziel, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMsg(null);

    // signIn wirft bei Netzfehlern — ungefangen blieb der Knopf für immer
    // gesperrt und der Nutzer ohne Meldung (Ultracode-Hinweis 13.08.2026).
    let res: Awaited<ReturnType<typeof signIn>>;
    try {
      res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
    } catch {
      setLoading(false);
      setMsg("Keine Verbindung. Bitte prüfe dein Netz und versuch es erneut.");
      return;
    }

    setLoading(false);

    if (!res || res.error) {
      // NextAuth reicht die Meldung aus authorize() im Fehlertext durch.
      const fehler = res?.error ?? "";
      setMsg(
        fehler.includes("EMAIL_NICHT_BESTAETIGT")
          ? "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link haben wir dir nach der Registrierung geschickt."
          : fehler.includes("ZU_VIELE_VERSUCHE")
            ? "Zu viele Anmeldeversuche. Bitte versuch es in einer Viertelstunde noch einmal."
            : "Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen."
      );
      return;
    }

    router.push(ziel);
    router.refresh();
  }

  return (
    <AppCard>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
        <AppInput label="E-Mail" value={email} placeholder="max@firma.de" type="email" name="email" autoComplete="email" inputMode="email" onChange={setEmail} />
        <AppInput label="Passwort" value={password} placeholder="Passwort eingeben" type="password" name="password" autoComplete="current-password" onChange={setPassword} />

        <div style={{ textAlign: "right", marginTop: -10 }}>
          <Link href="/forgot-password" style={{ color: "var(--vfa-gruen-text)", fontSize: "var(--t-klein)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Passwort vergessen?
          </Link>
        </div>

        <AppButton type="submit" disabled={loading || !email.trim() || !password.trim()} variant="primary" fullWidth>
          {loading ? "Wird angemeldet …" : "Anmelden"}
        </AppButton>

        {msg && <Meldung art="fehler">{msg}</Meldung>}
      </form>
    </AppCard>
  );
}

const UNTERTITEL: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "var(--t-basis)",
  lineHeight: "var(--lh-weit)",
  color: "var(--vfa-text-2)",
};

const FUSSZEILE: React.CSSProperties = {
  marginTop: 20,
  textAlign: "center",
  fontSize: "var(--t-klein)",
  color: "var(--vfa-text-2)",
};

const FUSSLINK: React.CSSProperties = {
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
