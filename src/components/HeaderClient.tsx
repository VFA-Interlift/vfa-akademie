"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function HeaderClient() {
  const { status } = useSession();

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;

        if (cancelled) return;

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
        // ignore
      }
    }

    if (status === "authenticated") load();

    if (status === "unauthenticated") {
      setEmail(null);
      setName(null);
      setCredits(null);
      setRole("USER");
    }

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <header
      style={{
        // ✅ sticky
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,

        // ✅ wichtig: eigener Hintergrund, sonst wirkt’s “transparent”
        background: "rgba(10, 10, 12, 0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",

        // ✅ dein bisheriges Layout
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* ✅ Logo links */}
      <a
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
        }}
      >
        <img
          src="/logo.png"
          alt="VFA Logo"
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            objectFit: "contain",
            opacity: 0.95,
          }}
        />
      </a>

      {/* ✅ Right Side */}
      {email ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Credits */}
          <span
            style={{
              padding: "6px 10px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 14,
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            title="Gesamtcredits"
          >
            Credits: {credits ?? 0}
          </span>

          {/* Willkommen + Name zweizeilig */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: 13, opacity: 0.7 }}>Willkommen</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>
              {name ?? "User"}
            </span>

            {/* Optional: Rolle anzeigen (nur falls du willst) */}
            {/* <span style={{ fontSize: 11, opacity: 0.6 }}>{role}</span> */}
          </div>
        </div>
      ) : (
        <span style={{ fontWeight: 400, color: "#aaa" }}>
          {status === "loading" ? "…" : ""}
        </span>
      )}
    </header>
  );
}
