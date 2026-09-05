"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";

/**
 * Einmaliger Glückwunsch-Moment beim Rangaufstieg.
 *
 * Der zuletzt gesehene Rang liegt im localStorage des Geräts (je Nutzer-ID).
 * Steigt der Rang gegenüber dem gespeicherten Stand, erscheint beim nächsten
 * Öffnen des Dashboards einmalig eine Feier-Einblendung; danach ist der neue
 * Stand gespeichert. Beim allerersten Besuch wird nur gespeichert — wer die
 * App neu installiert, soll nicht für alte Ränge gefeiert werden. Ein
 * Abstieg (Admin-Korrektur) wird still übernommen.
 *
 * Bei "Bewegung reduzieren" fällt das Konfetti weg, der Glückwunsch bleibt.
 */
const RANG_STUFEN: Record<string, number> = {
  STARTER: 0,
  BRONZE: 1,
  SILBER: 2,
  GOLD: 3,
  EXPERTE: 4,
};

const KONFETTI_FARBEN = ["#FFC100", "#007873", "#FFFFFF", "#A86C3D", "#8E99A8"];

export default function RangAufstieg({
  userId,
  rangKey,
  rangLabel,
  rangFarbe,
}: {
  userId: string;
  rangKey: string;
  rangLabel: string;
  rangFarbe: string;
}) {
  const [sichtbar, setSichtbar] = useState(false);
  const [mitKonfetti, setMitKonfetti] = useState(true);

  useEffect(() => {
    const schluessel = `vfa-rang-stand:${userId}`;
    try {
      const alt = window.localStorage.getItem(schluessel);
      const neuStufe = RANG_STUFEN[rangKey] ?? 0;

      if (alt !== null && RANG_STUFEN[alt] !== undefined && neuStufe > RANG_STUFEN[alt]) {
        // Der alte Stand liegt im localStorage und ist erst nach dem
        // Einhängen lesbar (Lint-Ausnahme wie in BottomNav, 05.09.2026).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMitKonfetti(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        setSichtbar(true);
      }
      window.localStorage.setItem(schluessel, rangKey);
    } catch {
      // Ohne localStorage keine Feier — aber auch kein Fehler.
    }
  }, [userId, rangKey]);

  if (!sichtbar) return null;

  return (
    <div
      role="dialog"
      aria-label={`Glückwunsch, du hast ${rangLabel} erreicht`}
      onClick={() => setSichtbar(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 40, 38, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 24,
      }}
    >
      {mitKonfetti && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                top: -14,
                left: `${(i * 137) % 100}%`,
                width: i % 3 === 0 ? 6 : 9,
                height: i % 2 === 0 ? 12 : 8,
                borderRadius: 2,
                background: KONFETTI_FARBEN[i % KONFETTI_FARBEN.length],
                opacity: 0.95,
                animation: `rangKonfetti ${2.6 + (i % 5) * 0.35}s linear ${(i % 7) * 0.18}s both`,
              }}
            />
          ))}
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--vfa-karte)",
          borderRadius: 20,
          padding: "30px 26px",
          maxWidth: 340,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
          animation: "pageFadeUp 480ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <div style={{ fontSize: 44, lineHeight: 1 }}>🏆</div>
        <h2 style={{ margin: "14px 0 0", fontSize: 22, fontWeight: 800, color: "var(--vfa-text)", letterSpacing: "-0.02em" }}>
          Glückwunsch!
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: "var(--vfa-text-2)", lineHeight: 1.5 }}>
          Du hast den Rang{" "}
          <strong style={{ color: rangFarbe }}>{rangLabel}</strong> erreicht.
        </p>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <AppButton onClick={() => setSichtbar(false)}>Weiter</AppButton>
        </div>
      </div>
    </div>
  );
}
