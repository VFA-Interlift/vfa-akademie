"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Die Rangliste als Etagenanzeige — das Erkennungszeichen einer Aufzugs-App.
 *
 * Links ein Schacht, in dem die Kabine beim Öffnen der Seite auf die aktuelle
 * Position fährt (Rang plus Fortschritt innerhalb des Rangs), rechts die
 * Etagen von der Dachterrasse (VFA-Experte) bis zum Erdgeschoss (Start).
 * Über dem Schacht eine kleine Anzeige mit der aktuellen Etage, wie im
 * echten Aufzug.
 *
 * Bei "Bewegung reduzieren" steht die Kabine sofort an ihrer Position.
 */
type Etage = {
  key: string;
  label: string;
  bereich: string;
  farbe: string;
  weich: string;
  rand: string;
};

const ROW = 46;
const GAP = 6;
const KABINE_H = 34;
const SCHACHT_B = 44;

export default function EtagenAnzeige({
  etagen,
  aktuellKey,
  anteil,
  etagenNummer,
}: {
  /** Etagen von OBEN nach UNTEN (Experte zuerst, Start zuletzt). */
  etagen: Etage[];
  aktuellKey: string;
  /** Kabinenposition 0 (ganz unten) bis 1 (ganz oben). */
  anteil: number;
  /** Anzeige über dem Schacht, z. B. "3" oder "EG". */
  etagenNummer: string;
}) {
  const hoehe = etagen.length * ROW + (etagen.length - 1) * GAP;
  const weg = hoehe - KABINE_H;
  const ziel = -Math.min(Math.max(anteil, 0), 1) * weg;

  const [versatz, setVersatz] = useState(0);
  const sanft = useRef(false);

  useEffect(() => {
    sanft.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sanft.current) {
      setVersatz(ziel);
      return;
    }
    // Erst unten starten, im nächsten Rahmen losfahren — sonst gibt es keinen
    // Übergang, weil der Browser Start und Ziel im selben Bild zeichnet.
    const t = window.setTimeout(() => setVersatz(ziel), 350);
    return () => window.clearTimeout(t);
  }, [ziel]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Etagenanzeige über dem Schacht */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: SCHACHT_B,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              minWidth: 34,
              textAlign: "center",
              padding: "3px 6px",
              borderRadius: 6,
              background: "#12312F",
              color: "#FFC100",
              fontSize: 13,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.08em",
            }}
          >
            {etagenNummer}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vfa-text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Deine Etage
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Schacht mit Kabine */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            width: SCHACHT_B,
            height: hoehe,
            flexShrink: 0,
            borderRadius: 10,
            background: "var(--vfa-karte-2)",
            border: "1px solid var(--vfa-linie)",
            overflow: "hidden",
          }}
        >
          {/* Führungsschienen */}
          <div style={{ position: "absolute", top: 4, bottom: 4, left: 9, width: 2, borderRadius: 1, background: "var(--vfa-linie)" }} />
          <div style={{ position: "absolute", top: 4, bottom: 4, right: 9, width: 2, borderRadius: 1, background: "var(--vfa-linie)" }} />

          {/* Etagenmarken */}
          {etagen.map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                top: i * (ROW + GAP) + ROW / 2,
                height: 1,
                background: "var(--vfa-linie)",
              }}
            />
          ))}

          {/* Kabine */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 2,
              width: 24,
              height: KABINE_H,
              marginLeft: -12,
              borderRadius: 6,
              background: "#007873",
              boxShadow: "0 2px 8px rgba(0, 61, 58, 0.45)",
              transform: `translate3d(0, ${versatz}px, 0)`,
              transition: sanft.current ? "none" : "transform 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Türspalt und Lampe */}
            <div style={{ position: "absolute", top: 6, bottom: 6, left: "50%", width: 1, background: "rgba(255,255,255,0.55)" }} />
            <div style={{ position: "absolute", top: 3, left: "50%", width: 6, height: 2, marginLeft: -3, borderRadius: 1, background: "#FFC100" }} />
          </div>
        </div>

        {/* Etagen */}
        <div style={{ display: "grid", gap: GAP, flex: 1, minWidth: 0 }}>
          {etagen.map((e) => {
            const aktiv = e.key === aktuellKey;
            return (
              <div
                key={e.key}
                style={{
                  height: ROW,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0 12px",
                  borderRadius: 8,
                  border: aktiv ? e.rand : "1px solid var(--vfa-linie-2)",
                  background: aktiv ? e.weich : "transparent",
                  transition: "all 140ms",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: aktiv ? 800 : 600, color: aktiv ? e.farbe : "var(--vfa-text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.label}
                </span>
                <span style={{ fontSize: 12, color: "var(--vfa-text-3)", whiteSpace: "nowrap", marginLeft: 8 }}>
                  {e.bereich}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
