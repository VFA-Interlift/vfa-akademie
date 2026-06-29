"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/meine-schulungen": "Meine Schulungen",
  "/meine-zertifikate": "Meine Zertifikate",
  "/kompetenzpass": "Kompetenzpass",
  "/meine-daten": "Meine Daten",
  "/kurskalender": "Kurskalender",
  "/feedback": "Feedback",
  "/admin/feedback": "Feedback-Auswertung",
  "/admin": "Administration",
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
    };

const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";
const VFA_GREY = "#C7C7C7";

// Seiten mit eigenem Brand-Layout (Login/Registrierung etc.) – dort soll der
// globale Header nicht erscheinen.
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

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
          return;
        }

        setEmail(data.email);
        setName(data.name);
        setCredits(data.creditsTotal);
        setRole(data.role);
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
  const hideMobileHeader = status === "authenticated" || status === "loading";

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (isAuthRoute) return null;

  return (
    <header
      className={hideMobileHeader ? "app-header app-header--authed" : "app-header"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: "#FFFFFF",
        borderBottom: `1px solid ${VFA_GREY}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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
          padding: "8px 18px",
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
            color: VFA_GREEN,
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
                fontSize: 17,
                fontWeight: 700,
                color: VFA_GREEN,
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
                color: "#888888",
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
                border: `1px solid ${VFA_GREY}`,
                background: menuOpen ? VFA_YELLOW : "#F4F4F4",
                color: "#1F1F1F",
                fontWeight: 900,
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                background: VFA_GREEN,
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textDecoration: "none",
              }}
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {isLoggedIn && menuOpen && (
        <div
          style={{
            borderTop: "1px solid #E6E6E6",
            background: "#FFFFFF",
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
                border: "1px solid #EBEBEB",
                background: "#F7F7F4",
                color: "#1F1F1F",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#666666",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Angemeldet als
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontWeight: 800,
                  color: VFA_GREEN,
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

              {role === "ADMIN" && (
                <MenuLink
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  variant="yellow"
                >
                  Admin
                </MenuLink>
              )}
            </nav>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 999,
                border: `1px solid ${VFA_GREY}`,
                background: "#EFEFEF",
                color: "#1F1F1F",
                fontWeight: 800,
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

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
        border: variant === "yellow" ? "none" : `1px solid ${VFA_GREY}`,
        background: variant === "yellow" ? VFA_YELLOW : "#F4F4F4",
        color: variant === "yellow" ? "#1F1F1F" : VFA_GREEN,
        fontSize: 13,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}