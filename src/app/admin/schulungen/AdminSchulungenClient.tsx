"use client";

import { useMemo, useState } from "react";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";

export type AdminKurs = {
  id: string;
  code: string;
  title: string;
  datumText: string;
  startIso: string | null;
  vergangen: boolean;
  ort: string | null;
  dozenten: string[];
  teilnehmer: { name: string; firma: string | null; email: string | null; attendanceStatus: string | null; angemeldetAm: string | null }[];
  enrollments: { name: string; status: string }[];
  signatureLists: { id: string; url: string; uploadedByName: string; uploadedText: string; pageCount: number }[];
};

type SortKey = "neueste" | "termin" | "code" | "teilnehmer" | "app";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "neueste", label: "Neueste Anmeldung zuerst" },
  { value: "termin", label: "Termin (nächste zuerst)" },
  { value: "code", label: "Kurscode (A–Z)" },
  { value: "teilnehmer", label: "Meiste Website-Anmeldungen" },
  { value: "app", label: "Meiste App-Anmeldungen" },
];

// Karten wie AppCard — <details> lässt sich nicht als AppCard rendern.
const karteStil: React.CSSProperties = {
  background: "var(--vfa-karte)",
  border: "1px solid var(--vfa-linie)",
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
};

/** Neueste Website-Anmeldung eines Kurses (ISO) – für Sortierung „neueste zuerst“. */
function letzteAnmeldung(kurs: AdminKurs): string {
  return kurs.teilnehmer.reduce((max, t) => (t.angemeldetAm && t.angemeldetAm > max ? t.angemeldetAm : max), "");
}

function formatAnmeldung(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Feste Zeitzone: Server (UTC) und Browser müssen dieselbe Uhrzeit ausgeben,
  // sonst springt die Anzeige beim Laden um (05.09.2026).
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}

function attendanceLabel(status: string | null): { text: string; color: string } {
  if (status === "ANWESEND") return { text: "✓ Da", color: "var(--vfa-gruen-text)" };
  if (status === "NICHT_DA") return { text: "✗ Nicht da", color: "var(--vfa-rot-text)" };
  if (status === "KRANK") return { text: "🤒 Krank", color: "var(--vfa-text-2)" };
  return { text: "offen", color: "var(--vfa-text-3)" };
}

export default function AdminSchulungenClient({ kurse }: { kurse: AdminKurs[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("neueste");
  const [suche, setSuche] = useState("");

  const sichtbar = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const gefiltert = q
      ? kurse.filter(
          (k) =>
            k.code.toLowerCase().includes(q) ||
            k.title.toLowerCase().includes(q) ||
            k.dozenten.some((d) => d.toLowerCase().includes(q)) ||
            k.teilnehmer.some((t) => t.name.toLowerCase().includes(q))
        )
      : kurse;

    const arr = [...gefiltert];
    switch (sortKey) {
      case "neueste":
        // Kurse mit der jüngsten Website-Anmeldung zuerst; Kurse ohne Anmeldung ans Ende.
        arr.sort((a, b) => letzteAnmeldung(b).localeCompare(letzteAnmeldung(a)));
        break;
      case "code":
        arr.sort((a, b) => a.code.localeCompare(b.code, "de"));
        break;
      case "teilnehmer":
        arr.sort((a, b) => b.teilnehmer.length - a.teilnehmer.length);
        break;
      case "app":
        arr.sort((a, b) => b.enrollments.length - a.enrollments.length);
        break;
      default:
        arr.sort((a, b) => {
          if (a.vergangen !== b.vergangen) return a.vergangen ? 1 : -1;
          return (a.startIso ?? "").localeCompare(b.startIso ?? "");
        });
    }
    return arr;
  }, [kurse, sortKey, suche]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px", minWidth: 180 }}>
          <AppSelect
            label="Sortieren nach"
            value={sortKey}
            onChange={(v) => setSortKey((v || "neueste") as SortKey)}
            options={SORT_OPTIONS}
          />
        </div>
        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <AppInput
            label="Suche (Schulung, Dozent, Teilnehmer)"
            value={suche}
            onChange={setSuche}
            placeholder="z. B. A2-2604 oder Göbel"
            inputMode="search"
          />
        </div>
      </div>

      {sichtbar.length === 0 ? (
        <div style={{ ...karteStil, padding: "16px 18px", color: "var(--vfa-text-2)", fontSize: "var(--t-basis)" }}>
          Keine Schulungen gefunden.
        </div>
      ) : (
        sichtbar.map((kurs) => (
          <details
            key={kurs.id}
            style={{ ...karteStil, opacity: kurs.vergangen ? 0.55 : 1 }}
          >
            <summary
              style={{
                listStyle: "none",
                cursor: "pointer",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: "var(--t-gross)", color: "var(--vfa-gruen-text)" }}>{kurs.code}</span>
                <span style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", marginLeft: 10 }}>{kurs.title}</span>
                <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-2)", marginTop: 3 }}>
                  📅 {kurs.datumText || "–"}
                  {kurs.ort ? <> · 📍 {kurs.ort.split(",")[0]}</> : null}
                  {kurs.dozenten.length > 0 && <> · 👤 {kurs.dozenten.join(", ")}</>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <CountPill label="Teilnehmer" value={kurs.teilnehmer.length} strong />
                <CountPill label="App" value={kurs.enrollments.length} />
                {kurs.teilnehmer.some((t) => t.attendanceStatus) && (
                  <div style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(0,120,115,0.08)", border: "1px solid rgba(0,120,115,0.25)", fontSize: "var(--t-label)", fontWeight: 800, color: "var(--vfa-gruen-text)", whiteSpace: "nowrap" }}>
                    {kurs.teilnehmer.filter((t) => t.attendanceStatus === "ANWESEND").length}/{kurs.teilnehmer.length} anwesend
                  </div>
                )}
              </div>
            </summary>

            <div style={{ borderTop: "1px solid var(--vfa-linie-2)", padding: "12px 18px 16px", display: "grid", gap: 14 }}>
              <div>
                <div className="etikett" style={{ marginBottom: 6 }}>
                  Website-Anmeldungen ({kurs.teilnehmer.length})
                </div>
                {kurs.teilnehmer.length === 0 ? (
                  <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)" }}>Noch keine Anmeldungen.</div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {[...kurs.teilnehmer]
                      .sort((a, b) => (b.angemeldetAm ?? "").localeCompare(a.angemeldetAm ?? ""))
                      .map((p, i) => {
                        const att = attendanceLabel(p.attendanceStatus);
                        const angemeldet = formatAnmeldung(p.angemeldetAm);
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "var(--vfa-karte-2)", border: "1px solid var(--vfa-linie-2)", borderRadius: 8, fontSize: "var(--t-klein)", flexWrap: "wrap" }}>
                            <span style={{ minWidth: 0 }}>
                              <span style={{ fontWeight: 700, color: "var(--vfa-text)" }}>
                                {p.name}
                                {p.firma && <span style={{ color: "var(--vfa-text-3)", fontWeight: 500 }}> · {p.firma}</span>}
                                {p.email && <span style={{ color: "var(--vfa-text-3)", fontWeight: 500 }}> · {p.email}</span>}
                              </span>
                              {angemeldet && (
                                <span style={{ display: "block", color: "var(--vfa-text-3)", fontWeight: 600, fontSize: "var(--t-label)", marginTop: 2 }}>
                                  🗓 angemeldet am {angemeldet}
                                </span>
                              )}
                            </span>
                            <span style={{ fontWeight: 800, color: att.color, fontSize: "var(--t-label)", whiteSpace: "nowrap" }}>{att.text}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div>
                <div className="etikett" style={{ marginBottom: 6 }}>
                  App-Anmeldungen ({kurs.enrollments.length})
                </div>
                {kurs.enrollments.length === 0 ? (
                  <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)" }}>Keine App-Anmeldungen.</div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {kurs.enrollments.map((e, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "rgba(255,193,0,0.12)", border: "1px solid rgba(255,193,0,0.25)", borderRadius: 8, fontSize: "var(--t-klein)", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "var(--vfa-text)" }}>{e.name}</span>
                        <span style={{ fontWeight: 700, color: "var(--vfa-text-2)", fontSize: "var(--t-label)" }}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {kurs.signatureLists.length > 0 && (
                <div>
                  <div className="etikett" style={{ marginBottom: 6 }}>
                    Unterschriebene Liste{kurs.signatureLists.length > 1 ? "n" : ""} ({kurs.signatureLists.length})
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {kurs.signatureLists.map((sh) => (
                      <div key={sh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "7px 10px", background: "var(--vfa-karte-2)", border: "1px solid var(--vfa-linie)", borderRadius: 8, fontSize: "var(--t-klein)", flexWrap: "wrap" }}>
                        <a href={sh.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--vfa-gruen-text)", fontWeight: 700, textDecoration: "none" }}>
                          📄 Liste · {sh.pageCount} {sh.pageCount === 1 ? "Seite" : "Seiten"}
                        </a>
                        <span style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-2)" }}>{sh.uploadedByName} · {sh.uploadedText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))
      )}
    </div>
  );
}

function CountPill({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 999,
      background: strong ? "rgba(0,120,115,0.08)" : "var(--vfa-karte-2)",
      border: strong ? "1px solid rgba(0,120,115,0.25)" : "1px solid var(--vfa-linie)",
      fontSize: "var(--t-label)",
      fontWeight: 800,
      color: strong ? "var(--vfa-gruen-text)" : "var(--vfa-text-2)",
      whiteSpace: "nowrap",
    }}>
      {value} {label}
    </div>
  );
}
