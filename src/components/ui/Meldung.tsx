type MeldungArt = "fehler" | "erfolg" | "hinweis";

type MeldungProps = {
  art?: MeldungArt;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Für Formularfehler: Screenreader lesen die Box sofort vor. */
  role?: "alert" | "status";
};

/**
 * Die eine Meldungsbox der App — Fehler, Erfolg, Hinweis. Ersetzt seit der
 * Launch-Runde (05.09.2026) die vielen selbstgebauten roten und grünen Kästen
 * und die nackten roten Fehlertexte; damit sehen Meldungen auf jeder Seite
 * gleich aus und bleiben im Dunkelmodus lesbar (nur Token-Farben).
 */
export default function Meldung({ art = "hinweis", children, style, role }: MeldungProps) {
  const farben: Record<MeldungArt, React.CSSProperties> = {
    fehler: {
      border: "1px solid rgba(176,0,32,0.24)",
      background: "rgba(176,0,32,0.06)",
      color: "var(--vfa-rot-text)",
    },
    erfolg: {
      border: "1px solid rgba(0,120,115,0.30)",
      background: "rgba(0,120,115,0.08)",
      color: "var(--vfa-gruen-text)",
    },
    hinweis: {
      border: "1px solid var(--vfa-linie)",
      background: "var(--vfa-karte-2)",
      color: "var(--vfa-text-2)",
    },
  };

  return (
    <div
      role={role ?? (art === "fehler" ? "alert" : undefined)}
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        fontSize: "var(--t-basis)",
        fontWeight: 600,
        lineHeight: "var(--lh-weit)",
        ...farben[art],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
