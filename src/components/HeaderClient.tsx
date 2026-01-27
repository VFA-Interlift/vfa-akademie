"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type MeResponse =
  | { ok: false; loggedIn: false }
  | { ok: true; loggedIn: true; email: string; creditsTotal: number };

export default function HeaderClient() {
  const { status } = useSession(); // "authenticated" | "unauthenticated" | "loading"
  const [email, setEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;

        if (cancelled) return;

        if (!data.ok) {
          setEmail(null);
          setCredits(null);
          return;
        }

        setEmail(data.email);
        setCredits(data.creditsTotal);
      } catch {
        // bei PWA offline o.ä. lieber nichts kaputt machen
      }
    }

    // Sobald Session “authenticated” ist, holen wir die aktuellen Headerdaten
    if (status === "authenticated") load();
    if (status === "unauthenticated") {
      setEmail(null);
      setCredits(null);
    }

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <header
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: 700,
        gap: 16,
      }}
    >
      <span>VFA-Akademie</span>

      {email ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              padding: "6px 10px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 14,
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
            title="Gesamtcredits"
          >
            Credits: {credits ?? 0}
          </span>

          <span style={{ fontWeight: 400, color: "#aaa" }}>{email}</span>
        </div>
      ) : (
        <span style={{ fontWeight: 400, color: "#aaa" }}>
          {status === "loading" ? "…" : ""}
        </span>
      )}
    </header>
  );
}
