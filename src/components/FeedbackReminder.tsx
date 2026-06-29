"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vfa_feedback_reminder_dismissed_count";

/**
 * Dismissbare Infobox ganz oben im Dashboard, wenn noch Feedback offen ist.
 * Der Dismiss-Status ist an die offene Anzahl gekoppelt: Wird später eine
 * weitere Schulung abgeschlossen (höhere Anzahl), erscheint die Box erneut.
 */
export default function FeedbackReminder({ openCount }: { openCount: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (openCount <= 0) return;
    const dismissed = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
    if (openCount > dismissed) setVisible(true);
  }, [openCount]);

  if (!visible || openCount <= 0) return null;

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, String(openCount));
    setVisible(false);
  }

  const label =
    openCount === 1
      ? "Für eine abgeschlossene Schulung steht noch Ihr Feedback aus."
      : `Für ${openCount} abgeschlossene Schulungen steht noch Ihr Feedback aus.`;

  return (
    <div
      style={{
        position: "relative",
        marginBottom: 14,
        padding: "10px 40px 10px 14px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(255,193,0,0.16), rgba(255,193,0,0.06))",
        border: "1px solid rgba(255,176,0,0.45)",
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis schließen"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "none",
          background: "transparent",
          color: "#8a6d00",
          fontSize: 20,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>★</span>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#1F1F1F", fontSize: 13 }}>{label}</div>
          <div style={{ color: "#5b4b00", fontSize: 12, marginTop: 1 }}>
            Geben Sie Feedback und erhalten Sie je Schulung +10 Credits.
          </div>
        </div>
        <Link
          href="/meine-zertifikate"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 30,
            padding: "5px 14px",
            borderRadius: 999,
            background: "#007873",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Jetzt bewerten
        </Link>
      </div>
    </div>
  );
}
