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
    const timer = window.setTimeout(() => setVisible(false), durationMs);

    return () => window.clearTimeout(timer);
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
        background: "#F7F7F4",
        color: "#1F1F1F",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          margin: 24,
          padding: 32,
          background: "#FFFFFF",
          border: "1px solid #FFC100",
          boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
          display: "grid",
          gap: 18,
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 6,
            background: "#FFC100",
          }}
        />

        <img
          src={logoSrc}
          alt={title}
          style={{
            width: 130,
            height: "auto",
            objectFit: "contain",
          }}
        />

        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#007873",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#333333",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          wird geladen…
        </div>
      </div>
    </div>
  );
}