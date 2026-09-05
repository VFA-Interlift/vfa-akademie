import { RAENGE, OHNE_RANG, type RangSchluessel } from "@/lib/credits/raenge";

/**
 * Die Rangleiter als schlichtes Infofeld unter dem Fortschrittsring.
 *
 * Ersetzt seit dem 05.09.2026 die Etagenanzeige mit Schacht und fahrender
 * Kabine (Tobis Ansage: „das mit dem Aufzug ist zwar schick, aber unnötig —
 * dann lieber ein Infofeld mit den Rängen"). Der Ring darüber zeigt den
 * Fortschritt; hier steht nur noch, welche Stufen es gibt und wo man steht.
 */
export default function RangUebersicht({
  aktuellKey,
  farben,
}: {
  aktuellKey: RangSchluessel;
  /** Rangfarbe je Stufe — die Seite gibt sie vor. */
  farben: Record<RangSchluessel, string>;
}) {
  // Von oben nach unten: höchste Stufe zuerst, „Start" zuletzt.
  const stufen = [...RAENGE].reverse().concat(OHNE_RANG);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {stufen.map((stufe) => {
        const aktuell = stufe.key === aktuellKey;
        const bereich =
          stufe.max === null
            ? `ab ${stufe.min.toLocaleString("de-DE")}`
            : `${stufe.min.toLocaleString("de-DE")}–${stufe.max.toLocaleString("de-DE")}`;

        return (
          <div
            key={stufe.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 10,
              // Nur die eigene Stufe wird hervorgehoben, alles andere bleibt ruhig.
              background: aktuell ? "var(--vfa-karte-2)" : "transparent",
              border: aktuell
                ? `1px solid ${farben[stufe.key]}`
                : "1px solid var(--vfa-linie-2)",
            }}
          >
            <span
              style={{
                fontSize: "var(--t-basis)",
                fontWeight: aktuell ? 800 : 600,
                color: aktuell ? farben[stufe.key] : "var(--vfa-text-2)",
              }}
            >
              {stufe.key === "STARTER" ? "Start" : stufe.label}
            </span>
            <span
              style={{
                fontSize: "var(--t-klein)",
                color: "var(--vfa-text-3)",
                whiteSpace: "nowrap",
              }}
            >
              {bereich}
            </span>
          </div>
        );
      })}
    </div>
  );
}
