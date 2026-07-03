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

export default function DozentKurseClient({ kurse }: { kurse: DozentKurs[] }) {
  const [openId, setOpenId] = useState<string | null>(kurse.length === 1 ? kurse[0].id : null);
  const [status, setStatus] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const k of kurse) for (const p of k.participants) initial[p.id] = p.attendanceStatus;
    return initial;
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Bevorstehend ({kurse.length})
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(176,0,32,0.3)", background: "rgba(176,0,32,0.07)", color: "#B00020", fontWeight: 700, fontSize: 13 }}>
          {error}
        </div>
      )}

      {kurse.map((kurs) => {
        const isOpen = openId === kurs.id;
        const done = kurs.participants.filter((p) => status[p.id]).length;

        return (
          <AppCard key={kurs.id} accent="green" style={{ padding: 0, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : kurs.id)}
              aria-expanded={isOpen}
              style={{ width: "100%", border: "none", background: "transparent", padding: "16px 18px", cursor: "pointer", textAlign: "left", color: "inherit" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 750, color: TEAL, lineHeight: 1.25 }}>
                    {kurs.code}
                  </div>
                  <div style={{ fontSize: 13, color: "#555555", marginTop: 3, lineHeight: 1.4 }}>{kurs.title}</div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 12.5, color: "#666666", fontWeight: 600 }}>
                    <span>📅 {kurs.datumText}</span>
                    {kurs.ort && <span>📍 {kurs.ort.split(",")[0]}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: TEAL, lineHeight: 1 }}>
                    {kurs.participants.length}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#888888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Teilnehmer
                  </div>
                  <div style={{ marginTop: 6, color: TEAL, fontSize: 20, fontWeight: 900 }}>{isOpen ? "−" : "+"}</div>
                </div>
              </div>
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid #E6E6E6", padding: "14px 18px 16px", background: "#FFFFFF" }}>
                {kurs.participants.length === 0 ? (
                  <div style={{ color: "#888888", fontSize: 14, lineHeight: 1.6 }}>
                    Noch keine Website-Anmeldungen für diese Schulung.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, color: "#888888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      <span>Angemeldete Teilnehmer</span>
                      <span>{done}/{kurs.participants.length} erfasst</span>
                    </div>

                    {kurs.participants.map((p) => {
                      const current = status[p.id] ?? null;
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "1px solid #EFEFEF",
                            background: "#FAFAF8",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1F1F1F", minWidth: 120 }}>
                            {p.name}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {STATUS_OPTIONS.map((opt) => {
                              const active = current === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={savingId === p.id}
                                  onClick={() => setAttendance(p.id, opt.value)}
                                  style={{
                                    padding: "6px 11px",
                                    borderRadius: 999,
                                    border: active ? `1.5px solid ${opt.color}` : "1px solid #D9D9D9",
                                    background: active ? opt.bg : "#FFFFFF",
                                    color: active ? opt.color : "#777777",
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    cursor: savingId === p.id ? "wait" : "pointer",
                                    opacity: savingId === p.id ? 0.6 : 1,
                                  }}
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
                )}
              </div>
            )}
          </AppCard>
        );
      })}
    </div>
  );
}
