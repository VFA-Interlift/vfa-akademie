"use client";

import { useEffect, useState } from "react";

/**
 * Der Dark-Mode-Schalter in den Einstellungen.
 *
 * Grundzustand ist immer die helle Fassung — die Geräte-Einstellung spielt
 * keine Rolle (Tobis Ansage vom 13.08.2026). Die Wahl liegt je Gerät im
 * localStorage ("vfa-dunkel") und wird beim App-Start vom Inline-Skript in
 * layout.tsx vor dem ersten Zeichnen gesetzt; hier wird sie nur umgelegt.
 */
export default function ThemaSchalter() {
  const [dunkel, setDunkel] = useState(false);

  useEffect(() => {
    setDunkel(document.documentElement.classList.contains("dunkel"));
  }, []);

  function umlegen() {
    const neu = !dunkel;
    setDunkel(neu);
    document.documentElement.classList.toggle("dunkel", neu);
    try {
      if (neu) window.localStorage.setItem("vfa-dunkel", "1");
      else window.localStorage.removeItem("vfa-dunkel");
    } catch {
      // Ohne localStorage gilt die Wahl eben nur bis zum nächsten Start.
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--vfa-text)", lineHeight: 1.3 }}>
          Dunkles Design
        </div>
        <div style={{ fontSize: 13, color: "var(--vfa-text-2)", marginTop: 4, lineHeight: 1.5 }}>
          Dunkle Flächen, helle Schrift — gilt für dieses Gerät.
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={dunkel}
        aria-label="Dunkles Design"
        onClick={umlegen}
        style={{
          position: "relative",
          flexShrink: 0,
          width: 52,
          height: 30,
          borderRadius: 999,
          border: "none",
          background: dunkel ? "#007873" : "#CFCFCF",
          cursor: "pointer",
          transition: "background 180ms ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: dunkel ? 25 : 3,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 180ms ease",
          }}
        />
      </button>
    </div>
  );
}
