"use client";

import { useEffect, useState } from "react";

export default function SplashGate({
  durationMs = 3000,
  logoSrc = "/logo.png",
  title = "VFA Akademie",
}: {
  durationMs?: number;
  logoSrc?: string;
  title?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #111 0%, #000 80%)",
        color: "#fff",
      }}
    >
      <div style={{ display: "grid", gap: 18, placeItems: "center" }}>
        <img
          src={logoSrc}
          alt={title}
          style={{ width: 140, height: "auto", opacity: 0.95 }}
        />

        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.3 }}>
          {title}
        </div>

        <div style={{ fontSize: 14, opacity: 0.65 }}>wird geladen…</div>
      </div>
    </div>
  );
}
