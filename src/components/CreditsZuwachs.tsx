"use client";

import { useEffect, useState } from "react";

/**
 * Zeigt unter dem Fortschrittskreis, wie viele Credits seit dem letzten Besuch
 * dazugekommen sind — „+20 seit deinem letzten Besuch".
 *
 * Der letzte Stand liegt im localStorage des Geräts, je Nutzer-ID getrennt,
 * damit sich zwei Konten auf demselben Handy nicht in die Quere kommen. Beim
 * allerersten Besuch wird nur gespeichert, nichts angezeigt. Weniger gewordene
 * Credits (Korrekturen durch den Admin) werden still übernommen — ein
 * „−20 seit letztem Besuch" wäre eine Ohrfeige ohne Erklärung.
 */
export default function CreditsZuwachs({
  userId,
  credits,
}: {
  userId: string;
  credits: number;
}) {
  const [zuwachs, setZuwachs] = useState(0);

  useEffect(() => {
    const schluessel = `vfa-credits-stand:${userId}`;
    try {
      const alt = window.localStorage.getItem(schluessel);
      if (alt !== null) {
        const vorher = Number(alt);
        if (Number.isFinite(vorher) && credits > vorher) {
          // Der alte Stand liegt im localStorage und ist erst nach dem
          // Einhängen lesbar (Lint-Ausnahme wie in BottomNav, 05.09.2026).
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setZuwachs(credits - vorher);
        }
      }
      window.localStorage.setItem(schluessel, String(credits));
    } catch {
      // Privatmodus ohne localStorage: dann eben ohne Zuwachs-Hinweis.
    }
  }, [userId, credits]);

  if (zuwachs <= 0) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: -6,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 14px",
          borderRadius: 999,
          background: "rgba(0, 120, 115, 0.10)",
          border: "1px solid rgba(0, 120, 115, 0.25)",
          color: "var(--vfa-gruen-text)",
          fontSize: 13,
          fontWeight: 800,
          animation: "pageFadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        ▲ +{zuwachs.toLocaleString("de-DE")} seit deinem letzten Besuch
      </span>
    </div>
  );
}
