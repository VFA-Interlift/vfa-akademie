import type { CSSProperties, ReactNode } from "react";

type KennzahlProps = {
  /** Kapitälchen-Etikett über der Zahl. */
  label: string;
  /** Zahlen werden mit Tausenderpunkt gesetzt; Text steht, wie er kommt. */
  value: number | string | ReactNode;
  /** Petrol für Erfolg, Rot für Fehler — sonst Textfarbe. */
  ton?: "standard" | "gruen" | "rot";
  /** Kachel über die ganze Rasterbreite. */
  breit?: boolean;
  style?: CSSProperties;
};

/**
 * Der Kennzahl-Kasten der App: kleines Etikett oben, Zahl darunter.
 *
 * Bis zum 05.09.2026 baute ihn jede Seite selbst — acht Fassungen unter fünf
 * Namen (StatBox, SummaryBox, StatCard, Kennzahl), mit Polstern von 10 bis 16,
 * Radien von 8 bis 12 und mal mit, mal ohne Tausenderpunkt. Nebeneinander sah
 * man das sofort: Ein zweizeiliges Etikett („Credits gesamt") schob seine Zahl
 * nach unten, die Nachbarzahl stand höher. Deshalb hier ein Raster mit zwei
 * Zeilen — das Etikett oben, die Zahl IMMER an der Unterkante, egal wie lang
 * die Beschriftung ist.
 */
export default function Kennzahl({ label, value, ton = "standard", breit = false, style }: KennzahlProps) {
  const farbe =
    ton === "gruen" ? "var(--vfa-gruen-text)" : ton === "rot" ? "var(--vfa-rot-text)" : undefined;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        alignItems: "end",
        gap: 6,
        minWidth: 0,
        padding: "14px 16px",
        borderRadius: 12,
        border:
          ton === "gruen"
            ? "1px solid rgba(0,120,115,0.25)"
            : ton === "rot"
              ? "1px solid rgba(176,0,32,0.25)"
              : "1px solid var(--vfa-linie-2)",
        background:
          ton === "gruen"
            ? "rgba(0,120,115,0.06)"
            : ton === "rot"
              ? "rgba(176,0,32,0.06)"
              : "var(--vfa-karte-2)",
        gridColumn: breit ? "1 / -1" : undefined,
        ...style,
      }}
    >
      <div className="etikett">{label}</div>
      <div className="kennzahl" style={farbe ? { color: farbe } : undefined}>
        {typeof value === "number" ? value.toLocaleString("de-DE") : value}
      </div>
    </div>
  );
}
