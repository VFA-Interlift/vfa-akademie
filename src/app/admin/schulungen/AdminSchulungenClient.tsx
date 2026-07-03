"use client";

import { useMemo, useState } from "react";

const TEAL = "#007873";

export type AdminKurs = {
  id: string;
  code: string;
  title: string;
  datumText: string;
  startIso: string | null;
  vergangen: boolean;
  ort: string | null;
  dozenten: string[];
  teilnehmer: { name: string; firma: string | null; email: string | null; attendanceStatus: string | null }[];
  enrollments: { name: string; status: string }[];
};

type SortKey = "termin" | "code" | "teilnehmer" | "app";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "termin", label: "Termin (nächste zuerst)" },
  { value: "code", label: "Kurscode (A–Z)" },
  { value: "teilnehmer", label: "Meiste Website-Anmeldungen" },
  { value: "app", label: "Meiste App-Anmeldungen" },
];

function attendanceLabel(status: string | null): { text: string; color: string } {
  if (status === "ANWESEND") return { text: "✓ Da", color: "#005f5b" };
  if (status === "NICHT_DA") return { text: "✗ Nicht da", color: "#B00020" };
  if (status === "KRANK") return { text: "🤒 Krank", color: "#7C5A0A" };
  return { text: "offen", color: "#999999" };
}

export default function AdminSchulungenClient({ kurse }: { kurse: AdminKurs[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("termin");
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
        <label style={{ display: "grid", gap: 4, flex: "1 1 200px", minWidth: 180 }}>
          <span style={labelStyle}>Sortieren nach</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={inputStyle}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, flex: "1 1 220px", minWidth: 200 }}>
          <span style={labelStyle}>Suche (Kurs, Dozent, Teilnehmer)</span>
          <input
            type="text"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="z. B. A2-2604 oder Göbel"
            style={inputStyle}
          />
        </label>
      </div>

      {sichtbar.length === 0 ? (
        <div style={{ padding: "16px 18px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: 12, color: "#888888", fontSize: 14 }}>
          Keine Schulungen gefunden.
        </div>
      ) : (
        sichtbar.map((kurs) => (
          <details
            key={kurs.id}
            style={{ background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: 12, opacity: kurs.vergangen ? 0.55 : 1 }}
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
                <span style={{ fontWeight: 800, fontSize: 15.5, color: TEAL }}>{kurs.code}</span>
                <span style={{ color: "#666666", fontSize: 13.5, marginLeft: 10 }}>{kurs.title}</span>
                <div style={{ fontSize: 12.5, color: "#888888", marginTop: 3 }}>
                  📅 {kurs.datumText || "–"}
                  {kurs.ort ? <> · 📍 {kurs.ort.split(",")[0]}</> : null}
                  {kurs.dozenten.length > 0 && <> · 👤 {kurs.dozenten.join(", ")}</>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <CountPill label="Teilnehmer" value={kurs.teilnehmer.length} strong />
                <CountPill label="App" value={kurs.enrollments.length} />
              </div>
            </summary>

            <div style={{ borderTop: "1px solid #F0F0F0", padding: "12px 18px 16px", display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Website-Anmeldungen ({kurs.teilnehmer.length})
                </div>
                {kurs.teilnehmer.length === 0 ? (
                  <div style={{ color: "#999999", fontSize: 13.5 }}>Noch keine Anmeldungen.</div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {kurs.teilnehmer.map((p, i) => {
                      const att = attendanceLabel(p.attendanceStatus);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "#FAFAF8", border: "1px solid #F0F0F0", borderRadius: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#1F1F1F" }}>
                            {p.name}
                            {p.firma && <span style={{ color: "#999999", fontWeight: 500 }}> · {p.firma}</span>}
                            {p.email && <span style={{ color: "#B0B0B0", fontWeight: 500 }}> · {p.email}</span>}
                          </span>
                          <span style={{ fontWeight: 800, color: att.color, fontSize: 12.5 }}>{att.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#7C5A0A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  App-Anmeldungen ({kurs.enrollments.length})
                </div>
                {kurs.enrollments.length === 0 ? (
                  <div style={{ color: "#999999", fontSize: 13.5 }}>Keine App-Anmeldungen.</div>
                ) : (
                  <div style={{ display: "grid", gap: 4 }}>
                    {kurs.enrollments.map((e, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "#FFFBEE", border: "1px solid rgba(255,193,0,0.25)", borderRadius: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "#1F1F1F" }}>{e.name}</span>
                        <span style={{ fontWeight: 700, color: "#7C5A0A", fontSize: 12.5 }}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>
        ))
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 800,
  color: TEAL,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #D4D4D4",
  background: "#FFFFFF",
  color: "#1F1F1F",
  fontSize: 14,
  fontWeight: 600,
  outlineColor: TEAL,
  width: "100%",
  boxSizing: "border-box",
};

function CountPill({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 999,
      background: strong ? "rgba(0,120,115,0.08)" : "#F4F4F2",
      border: strong ? "1px solid rgba(0,120,115,0.25)" : "1px solid #E6E6E6",
      fontSize: 12,
      fontWeight: 800,
      color: strong ? TEAL : "#666666",
      whiteSpace: "nowrap",
    }}>
      {value} {label}
    </div>
  );
}
