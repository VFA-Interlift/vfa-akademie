/**
 * Gemeinsame Stile für Impressum und Datenschutz — vorher in beiden Seiten
 * doppelt definiert (Launch-Runde 05.09.2026). Nur Token: die Seiten müssen im
 * Dunkelmodus lesbar bleiben.
 */
export const ABSCHNITT: React.CSSProperties = { marginTop: 32 };

/** Abschnittstitel: h2 mit className="etikett", hier nur der Abstand. */
export const TITEL: React.CSSProperties = { margin: "0 0 8px" };

export const TEXT: React.CSSProperties = {
  fontSize: "var(--t-basis)",
  lineHeight: "var(--lh-weit)",
  color: "var(--vfa-text)",
  margin: "0 0 12px",
};

export const LISTE: React.CSSProperties = { ...TEXT, paddingLeft: 20 };

export const UNTERTITEL: React.CSSProperties = {
  ...TEXT,
  color: "var(--vfa-text-2)",
  margin: "0 0 20px",
};

export const LINK: React.CSSProperties = { color: "var(--vfa-gruen-text)" };
