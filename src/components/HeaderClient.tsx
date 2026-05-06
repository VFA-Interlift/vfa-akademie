"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

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

export default function HeaderClient() {
  const { status } = useSession();

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", {
        cache: "no-store",
      });

      const data = (await res.json()) as MeResponse;

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
      // bewusst still: Header darf die App nicht blockieren
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadMe();
    }

    if (status === "unauthenticated") {
      setEmail(null);
      setName(null);
      setCredits(null);
      setRole("USER");
    }
  }, [status, loadMe]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const onFocus = () => {
      loadMe();
    };

    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      loadMe();
    }, 15000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [status, loadMe]);

  return (
    <header
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
          minHeight: 82,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <Link
          href={email ? "/dashboard" : "/login"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
            color: VFA_GREEN,
            minWidth: 210,
          }}
        >
          <img
            src="/logo.png"
            alt="VFA Logo"
            style={{
              width: 58,
              height: 58,
              objectFit: "contain",
            }}
          />

          <div style={{ lineHeight: 1.15 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: VFA_GREEN,
                letterSpacing: "0.02em",
              }}
            >
              VFA-Akademie
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                fontWeight: 700,
                color: "#555555",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Schulungen · Zertifikate · Credits
            </div>
          </div>
        </Link>

        {email && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/meine-schulungen">Schulungen</NavLink>
            <NavLink href="/meine-zertifikate">Zertifikate</NavLink>
            <NavLink href="/meine-daten">Meine Daten</NavLink>

            {role === "ADMIN" && (
              <NavLink href="/admin" strong>
                Admin
              </NavLink>
            )}
          </nav>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
            minWidth: 220,
          }}
        >
          {email ? (
            <>
              <span
                title="Gesamtcredits"
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: VFA_GREEN,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Credits: {credits ?? 0}
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.2,
                  textAlign: "right",
                  maxWidth: 190,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#666666",
                    fontWeight: 700,
                  }}
                >
                  Willkommen
                </span>

                <span
                  title={email}
                  style={{
                    fontWeight: 800,
                    color: "#1F1F1F",
                    fontSize: 14,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name ?? email}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${VFA_GREY}`,
                  background: "#EFEFEF",
                  color: "#1F1F1F",
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                padding: "10px 18px",
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
    </header>
  );
}

function NavLink({
  href,
  children,
  strong = false,
}: {
  href: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 36,
        padding: "8px 13px",
        borderRadius: 999,
        border: strong ? "none" : `1px solid ${VFA_GREY}`,
        background: strong ? VFA_YELLOW : "#F4F4F4",
        color: strong ? "#1F1F1F" : VFA_GREEN,
        fontSize: 12,
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