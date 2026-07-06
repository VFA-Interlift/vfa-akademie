"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";

const TEAL = "#007873";

export type DozentKurs = {
  id: string;
  title: string;
  code: string;
  datumText: string;
  ort: string | null;
  /** DOZENT = hält die Schulung, HOSPITATION = hospitiert. */
  rolle: "DOZENT" | "HOSPITATION";
  /** Feedback-Auswertung (PDF-Download), wenn Abgaben vorliegen. */
  feedback: { trainingId: string; count: number } | null;
  participants: {
    id: string;
    name: string;
    attendanceStatus: string | null;
  }[];
};

const STATUS_OPTIONS: { value: string; label: string; color: string; bg: string }[] = [
  { value: "ANWESEND", label: "✓ Da", color: "#005f5b", bg: "rgba(0,120,115,0.12)" },
  { value: "NICHT_DA", label: "✗ Nicht da", color: "#B00020", bg: "rgba(176,0,32,0.10)" },
  { value: "KRANK", label: "🤒 Krank", color: "#7C5A0A", bg: "rgba(255,193,0,0.15)" },
];

// Organisations-/Logistik-Felder. Werden künftig automatisch aus der
// Bestätigungs-/Orga-Mail befüllt (CC an die Akademie-Adresse). Bis dahin
// Platzhalter, damit die Dozenten sehen, dass der Bereich kommt.
const INFO_FELDER: { icon: string; label: string }[] = [
  { icon: "🏨", label: "Hotel / Übernachtung" },
  { icon: "🚗", label: "Anreise & Parken" },
  { icon: "👤", label: "Ansprechpartner vor Ort" },
  { icon: "🕐", label: "Ablauf & Zeiten" },
  { icon: "🍽", label: "Verpflegung" },
  { icon: "🖥", label: "Technik & Raum" },
];

type TabKey = "infos" | "teilnehmer" | "feedback";
const TABS: { key: TabKey; label: string }[] = [
  { key: "infos", label: "Infos" },
  { key: "teilnehmer", label: "Teilnehmer" },
  { key: "feedback", label: "Feedback" },
];

const labelHead: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 800,
  color: TEAL,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 8,
};

export default function DozentKurseClient({ kurse }: { kurse: DozentKurs[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(kurse.length === 1 ? kurse[0].id : null);
  const [tab, setTab] = useState<TabKey>("teilnehmer");
  const [status, setStatus] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const k of kurse) for (const p of k.participants) initial[p.id] = p.attendanceStatus;
    return initial;
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openKurs(id: string) {
    setSelectedId(id);
    setTab("teilnehmer");
  }

  async function setAttendance(participantId: string, newStatus: string | null) {
    const previous = status[participantId] ?? null;
    // Nochmal antippen = zurück auf „offen".
    const next = previous === newStatus ? null : newStatus;

    setStatus((s) => ({ ...s, [participantId]: next }));
    setSavingId(participantId);
    setError("");

    try {
      const res = await fetch("/api/dozent/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "SAVE_FAILED");
    } catch {
      setStatus((s) => ({ ...s, [participantId]: previous }));
      setError("Speichern fehlgeschlagen – bitte erneut versuchen.");
    } finally {
      setSavingId(null);
    }
  }

  const errorBanner = error ? (
    <div style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(176,0,32,0.3)", background: "rgba(176,0,32,0.07)", color: "#B00020", fontWeight: 700, fontSize: 13 }}>
      {error}
    </div>
  ) : null;

  const selected = selectedId ? kurse.find((k) => k.id === selectedId) ?? null : null;

  // ─────────────────────────── Detail-Ansicht ───────────────────────────
  if (selected) {
    const done = selected.participants.filter((p) => status[p.id]).length;
    const anwesend = selected.participants.filter((p) => (status[p.id] ?? null) === "ANWESEND").length;

    return (
      <div style={{ display: "grid", gap: 14 }}>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: TEAL, fontWeight: 800, fontSize: 14, cursor: "pointer", padding: "2px 0" }}
        >
          ← Zurück zur Übersicht
        </button>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 800, color: TEAL, lineHeight: 1.2 }}>{selected.code}</div>
            {selected.rolle === "HOSPITATION" && (
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7C5A0A", background: "rgba(255,193,0,0.15)", border: "1px solid rgba(255,176,0,0.45)", borderRadius: 999, padding: "3px 9px" }}>
                Hospitation
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, color: "#555555", marginTop: 4, lineHeight: 1.4 }}>{selected.title}</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 13, color: "#666666", fontWeight: 600 }}>
            <span>📅 {selected.datumText}</span>
            {selected.ort && <span>📍 {selected.ort.split(",")[0]}</span>}
            <span>👥 {selected.participants.length} Teilnehmer{selected.participants.length > 0 ? ` · ${anwesend} anwesend` : ""}</span>
          </div>
        </div>

        {errorBanner}

        {/* Tab-Leiste */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E6E6E6", overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{ padding: "9px 16px", border: "none", background: "transparent", borderBottom: active ? `2px solid ${TEAL}` : "2px solid transparent", color: active ? TEAL : "#888888", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap" }}
              >
                {t.label}
                {t.key === "teilnehmer" && selected.participants.length > 0 ? ` (${selected.participants.length})` : ""}
              </button>
            );
          })}
        </div>

        <AppCard>
          {tab === "infos" && (
            <div>
              <div style={labelHead}>Organisation & Logistik</div>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                {INFO_FELDER.map((f) => (
                  <div key={f.label} style={{ padding: "10px 12px", border: "1px dashed #D9D9D9", borderRadius: 10, background: "#FBFBF9" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#555555" }}>{f.icon} {f.label}</div>
                    <div style={{ fontSize: 12.5, color: "#AAAAAA", fontStyle: "italic", marginTop: 3 }}>Inhalt folgt</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: "#999999", marginTop: 8, lineHeight: 1.5 }}>
                Diese Infos werden künftig automatisch aus der Organisations-/Bestätigungsmail übernommen.
              </div>
            </div>
          )}

          {tab === "teilnehmer" && (
            selected.participants.length === 0 ? (
              <div style={{ color: "#888888", fontSize: 14, lineHeight: 1.6 }}>
                Noch keine Website-Anmeldungen für diese Schulung.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, fontSize: 11.5, fontWeight: 700, color: "#999999", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>Antippen: Da / Nicht da / Krank</span>
                  <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{done}/{selected.participants.length} erfasst</span>
                </div>

                {selected.participants.map((p) => {
                  const current = status[p.id] ?? null;
                  return (
                    <div
                      key={p.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 11px", borderRadius: 10, border: "1px solid #EFEFEF", background: "#FAFAF8", flexWrap: "wrap" }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1F1F1F", minWidth: 100 }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.map((opt) => {
                          const active = current === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={savingId === p.id}
                              onClick={() => setAttendance(p.id, opt.value)}
                              style={{ padding: "5px 10px", borderRadius: 999, border: active ? `1.5px solid ${opt.color}` : "1px solid #D9D9D9", background: active ? opt.bg : "#FFFFFF", color: active ? opt.color : "#777777", fontSize: 12, fontWeight: 800, cursor: savingId === p.id ? "wait" : "pointer", opacity: savingId === p.id ? 0.6 : 1 }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === "feedback" && (
            selected.feedback ? (
              <div>
                <div style={labelHead}>Feedback-Auswertung</div>
                <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#666666", lineHeight: 1.6 }}>
                  {selected.feedback.count} Rückmeldung{selected.feedback.count === 1 ? "" : "en"} liegen vor.
                </p>
                <a
                  href={`/api/dozent/feedback/pdf?trainingId=${selected.feedback.trainingId}`}
                  download
                  className="vfa-btn"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "11px 20px", borderRadius: 999, background: TEAL, color: "#FFFFFF", fontSize: 13.5, fontWeight: 800, letterSpacing: "0.04em", textDecoration: "none" }}
                >
                  📄 Feedback-Auswertung herunterladen
                </a>
              </div>
            ) : (
              <div style={{ color: "#888888", fontSize: 14, lineHeight: 1.6 }}>
                Noch keine Feedback-Abgaben für diese Schulung.
              </div>
            )
          )}
        </AppCard>
      </div>
    );
  }

  // ─────────────────────────── Listen-Ansicht ───────────────────────────
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Bevorstehend ({kurse.length})
      </div>

      {errorBanner}

      {kurse.map((kurs) => {
        const anwesend = kurs.participants.filter((p) => (status[p.id] ?? null) === "ANWESEND").length;

        return (
          <AppCard key={kurs.id} accent="green" style={{ padding: 0, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => openKurs(kurs.id)}
              style={{ width: "100%", border: "none", background: "transparent", padding: "16px 18px", cursor: "pointer", textAlign: "left", color: "inherit" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 750, color: TEAL, lineHeight: 1.25 }}>
                      {kurs.code}
                    </div>
                    {kurs.rolle === "HOSPITATION" && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7C5A0A", background: "rgba(255,193,0,0.15)", border: "1px solid rgba(255,176,0,0.45)", borderRadius: 999, padding: "3px 9px" }}>
                        Hospitation
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#555555", marginTop: 3, lineHeight: 1.4 }}>{kurs.title}</div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 12.5, color: "#666666", fontWeight: 600 }}>
                    <span>📅 {kurs.datumText}</span>
                    {kurs.ort && <span>📍 {kurs.ort.split(",")[0]}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: TEAL, lineHeight: 1 }}>
                      {kurs.participants.length}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#888888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Teilnehmer
                    </div>
                    {kurs.participants.length > 0 && (
                      <div style={{ fontSize: 11, color: "#005f5b", fontWeight: 800, marginTop: 4, whiteSpace: "nowrap" }}>
                        {anwesend} anwesend
                      </div>
                    )}
                  </div>
                  <div style={{ color: TEAL, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>›</div>
                </div>
              </div>
            </button>
          </AppCard>
        );
      })}
    </div>
  );
}
