"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";

// Untertitel im Kopf = Bandtitel der Seite. Vollständig für jede Route unter
// src/app (Launch-Runde 05.09.2026); vorher fielen sieben Seiten auf
// „Schulungen · Zertifikate“ zurück. Die Suche läuft mit startsWith von oben
// nach unten — Unterseiten des Adminbereichs stehen deshalb vor „/admin“.
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/meine-schulungen": "Meine Schulungen",
  "/meine-zertifikate": "Meine Zertifikate",
  "/kompetenzpass": "Kompetenzpass",
  "/meine-daten": "Meine Daten",
  "/meine-credits": "Meine Credits",
  "/kurskalender": "Kurskalender",
  "/training": "Schulungsdetail",
  "/feedback": "Feedback zur Schulung",
  "/badges": "Badges",
  "/leaderboard": "Ranking",
  "/einstellungen": "Einstellungen",
  "/dozent": "Dozentenbereich",
  "/app-test": "Rückmeldung zur App",
  "/admin/app-test": "Rückmeldung zur App",
  "/admin/cobra": "Cobra/WebConnect",
  "/admin/credits": "Credits verwalten",
  "/admin/feedback": "Feedback-Auswertung",
  "/admin/import": "Historie importieren",
  "/admin/schulungen": "Schulungen & Teilnehmer",
  "/admin/trainings": "Schulungen in der App-DB",
  "/admin/users": "Nutzer verwalten",
  "/admin/website": "Website-Synchronisation",
  "/admin": "Adminbereich",
  "/impressum": "Impressum",
  "/datenschutz": "Datenschutz",
  "/login": "Anmelden",
  "/register": "Konto erstellen",
  "/forgot-password": "Passwort vergessen",
  "/reset-password": "Neues Passwort",
  "/e-mail-bestaetigen": "E-Mail bestätigen",
};

type MeResponse =
  | { ok: false; loggedIn: false }
  | {
      ok: true;
      loggedIn: true;
      email: string;
      name: string | null;
      creditsTotal: number;
      role: "USER" | "ADMIN";
      isInstructor: boolean;
    };

// Petrol und Gelb als FLÄCHE (Credits-Chip, gelbe Linie, Menü-Hervorhebung)
// bleiben fest — als Textfarbe gilt das Token var(--vfa-gruen-text).
const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";

// Der Kopf erscheint seit der Launch-Runde (05.09.2026) auf JEDER Seite, auch
// auf der Anmeldefamilie und auf Impressum/Datenschutz — Tobis Auftrag: „das
// Design auf jeder Seite gleich, auch der Header oben, beim Einloggen, beim
// Registrieren“. Einzige Ausnahme: Die „Anmelden“-Pille rechts entfällt auf
// den fünf Seiten, zu denen sie führen würde.
const ANMELDE_SEITEN = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/e-mail-bestaetigen",
];

export default function HeaderClient() {
  const { status } = useSession();
  const pathname = usePathname();

  const pageLabel = Object.entries(PAGE_LABELS).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? "Schulungen · Zertifikate";

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [isInstructor, setIsInstructor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    fetch("/api/me", {
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<MeResponse>)
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data.ok) {
          setEmail(null);
          setName(null);
          setCredits(null);
          setRole("USER");
          setIsInstructor(false);
          return;
        }

        setEmail(data.email);
        setName(data.name);
        setCredits(data.creditsTotal);
        setRole(data.role);
        setIsInstructor(data.isInstructor);
      })
      .catch(() => {
        // Header darf die App nicht blockieren.
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setEmail(null);
      setName(null);
      setCredits(null);
      setRole("USER");
      setIsInstructor(false);
      setMenuOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function refreshMe() {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = (await res.json()) as MeResponse;

        if (cancelled) {
          return;
        }

        if (!data.ok) {
          setEmail(null);
          setName(null);
          setCredits(null);
          setRole("USER");
          return;
        }

        setEmail(data.email);
        setName(data.name);
        setCredits(data.creditsTotal);
        setRole(data.role);
      } catch {
        // Header darf die App nicht blockieren.
      }
    }

    const onFocus = () => {
      void refreshMe();
    };

    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      void refreshMe();
    }, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [status]);

  const isLoggedIn = status === "authenticated" && Boolean(email);

  // Hide the mobile header as soon as we know a session exists (status), not
  // only after the /api/me fetch resolves – otherwise the header flashes briefly
  // on top before the bottom nav takes over on app start.
  // globals.css blendet die Klasse nur unter body.has-bottom-nav aus — wo es
  // keine untere Leiste gibt, bleibt der Kopf auch eingeloggt stehen.
  const hideMobileHeader = status === "authenticated" || status === "loading";

  const anmeldeSeite = ANMELDE_SEITEN.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  return (
    <header
      className={hideMobileHeader ? "app-header app-header--authed" : "app-header"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: "var(--vfa-karte)",
        borderBottom: "1px solid var(--vfa-linie)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        // Unter der Aussparung des iPhones (black-translucent) läuft der Kopf
        // bis an die Oberkante; dieses Polster hält Logo und Titel unterhalb
        // der Uhr, der Petrol-Streifen (SafeTop) liegt genau auf dem Polster.
        // .page-content rechnet dieselbe Höhe mit (layout.tsx), das Band der
        // Seite beginnt also weiter direkt unter dem Kopf (05.09.2026).
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        style={{
          height: 5,
          width: "100%",
          background: VFA_YELLOW,
        }}
      />

      <div
        style={{
          minHeight: 72,
          // Seitlich mindestens so weit einrücken, wie das Gerät im Querformat
          // für die Aussparung meldet (05.09.2026).
          padding:
            "8px max(18px, env(safe-area-inset-right, 0px)) 8px max(18px, env(safe-area-inset-left, 0px))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--vfa-gruen-text)",
            minWidth: 0,
          }}
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/logo.png"
            alt="VFA Logo"
            style={{
              width: 46,
              height: 46,
              objectFit: "contain",
              flex: "0 0 auto",
            }}
          />

          <div style={{ lineHeight: 1.15, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--t-gross)",
                fontWeight: 700,
                color: "var(--vfa-gruen-text)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              VFA-Akademie
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--vfa-text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                whiteSpace: "nowrap",
              }}
            >
              {pageLabel}
            </div>
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
          }}
        >
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-label="Menü öffnen"
              style={{
                minWidth: 42,
                height: 42,
                borderRadius: 999,
                border: "1px solid var(--vfa-linie)",
                // Gelb ist gelb in beiden Modi, das Zeichen darauf fest dunkel.
                background: menuOpen ? VFA_YELLOW : "var(--vfa-karte-2)",
                color: menuOpen ? "#1F1F1F" : "var(--vfa-text)",
                fontWeight: 700,
                fontSize: "var(--t-titel)",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          ) : (
            !anmeldeSeite && <AppButton href="/login">Anmelden</AppButton>
          )}
        </div>
      </div>

      {isLoggedIn && menuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--vfa-linie)",
            background: "var(--vfa-karte)",
            padding: "14px 18px 18px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 10,
              maxWidth: 520,
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--vfa-linie)",
                background: "var(--vfa-karte-2)",
                color: "var(--vfa-text)",
              }}
            >
              <div className="etikett">Angemeldet als</div>

              <div
                style={{
                  marginTop: 4,
                  fontWeight: 700,
                  color: "var(--vfa-gruen-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={email ?? ""}
              >
                {name ?? email}
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: VFA_GREEN,
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Credits: {credits ?? 0}
              </div>
            </div>

            <nav
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <MenuLink href="/dashboard" onClick={() => setMenuOpen(false)}>
                Dashboard
              </MenuLink>

              <MenuLink
                href="/meine-schulungen"
                onClick={() => setMenuOpen(false)}
              >
                Meine Schulungen
              </MenuLink>

              <MenuLink
                href="/meine-zertifikate"
                onClick={() => setMenuOpen(false)}
              >
                Meine Zertifikate
              </MenuLink>

              <MenuLink href="/kompetenzpass" onClick={() => setMenuOpen(false)}>
                Kompetenzpass
              </MenuLink>

              <MenuLink href="/meine-daten" onClick={() => setMenuOpen(false)}>
                Meine Daten
              </MenuLink>

              <MenuLink href="/kurskalender" onClick={() => setMenuOpen(false)}>
                Kurskalender
              </MenuLink>

              <MenuLink href="/meine-credits" onClick={() => setMenuOpen(false)}>
                Meine Credits
              </MenuLink>

              <MenuLink href="/badges" onClick={() => setMenuOpen(false)}>
                Badges
              </MenuLink>

              <MenuLink href="/leaderboard" onClick={() => setMenuOpen(false)}>
                Ranking
              </MenuLink>

              {/* Einstellungen hängen sonst allein an der unteren Leiste, die ab
                  760px ausgeblendet wird — Datenauskunft, Kontolöschung und der
                  Weg, Fehler zu melden, wären am Rechner nicht erreichbar. */}
              <MenuLink href="/einstellungen" onClick={() => setMenuOpen(false)}>
                Einstellungen
              </MenuLink>

              {isInstructor && (
                <MenuLink href="/dozent" onClick={() => setMenuOpen(false)}>
                  Dozentenbereich
                </MenuLink>
              )}

              {role === "ADMIN" && (
                <MenuLink
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  variant="yellow"
                >
                  Adminbereich
                </MenuLink>
              )}
            </nav>

            <AppButton
              variant="secondary"
              fullWidth
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Abmelden
            </AppButton>
          </div>
        </div>
      )}
    </header>
  );
}

// Menü-Pillen in den Maßen von AppButton (42/14/700, Versalien); die Optik —
// Petrol-Schrift auf eingelassener Fläche, volle Breite in der Rasterzelle —
// bleibt, deshalb kein AppButton-Import. Farben als Token statt #F4F4F4 und
// #C7C7C7 (Launch-Runde 05.09.2026).
function MenuLink({
  href,
  children,
  onClick,
  variant = "default",
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "yellow";
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 42,
        padding: "10px 14px",
        borderRadius: 999,
        border: variant === "yellow" ? "none" : "1px solid var(--vfa-linie)",
        background: variant === "yellow" ? VFA_YELLOW : "var(--vfa-karte-2)",
        color: variant === "yellow" ? "#1F1F1F" : "var(--vfa-gruen-text)",
        fontSize: 14,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}