"use client";

import { useRef, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import StatusBadge from "@/components/ui/StatusBadge";
import PdfAnsichtLink from "@/components/PdfAnsichtLink";

// Petrol nur noch für Flächen und Linien; als Textfarbe gilt das Token
// --vfa-gruen-text, damit der Dunkelmodus aufhellen kann (Launch-Runde 05.09.2026).
const TEAL = "#007873";
const GRUEN_TEXT = "var(--vfa-gruen-text)";

export type DozentKurs = {
  id: string;
  title: string;
  code: string;
  datumText: string;
  ort: string | null;
  /** DOZENT = hält die Schulung, HOSPITATION = hospitiert. */
  rolle: "DOZENT" | "HOSPITATION";
  /** true, wenn die Schulung bereits vorbei ist (Feedback bleibt einsehbar). */
  vergangen: boolean;
  /** Kurscode (UPPERCASE) für Uploads/Zuordnung. */
  matchCode: string;
  /** Feedback-Auswertung (PDF-Download), wenn Abgaben vorliegen. */
  feedback: { trainingId: string; count: number } | null;
  /** Orga-/Bestätigungsmails (per CC an die Akademie-Inbound-Adresse), neueste zuerst. */
  orga: {
    id: string;
    subject: string | null;
    fromAddress: string | null;
    receivedText: string;
    text: string | null;
    images: { url: string; filename: string }[];
    files: { url: string; filename: string }[];
  }[];
  /** Hochgeladene, unterschriebene Teilnehmerlisten (PDF), neueste zuerst. */
  signatureLists: {
    id: string;
    url: string;
    uploadedByName: string;
    uploadedText: string;
    pageCount: number;
    mine: boolean;
  }[];
  participants: {
    id: string;
    name: string;
    attendanceStatus: string | null;
  }[];
};

// Gewählter Status in Token-Farben (Dunkelmodus). „Krank" folgt dem Gelb-Muster
// von StatusBadge warning: dunkler Text auf gelbem Schein, weil Gelb als
// Schrift auf hellem Grund nicht lesbar wäre (05.09.2026).
const STATUS_OPTIONS: { value: string; label: string; color: string; bg: string; border: string }[] = [
  { value: "ANWESEND", label: "✓ Da", color: GRUEN_TEXT, bg: "rgba(0,120,115,0.12)", border: GRUEN_TEXT },
  { value: "NICHT_DA", label: "✗ Nicht da", color: "var(--vfa-rot-text)", bg: "rgba(176,0,32,0.10)", border: "var(--vfa-rot-text)" },
  { value: "KRANK", label: "🤒 Krank", color: "var(--vfa-text)", bg: "rgba(255,193,0,0.25)", border: "#FFC100" },
];

// Organisations-/Logistik-Felder. Werden künftig automatisch aus der
// Bestätigungs-/Orga-Mail befüllt (CC an die Akademie-Adresse). Bis dahin
// Platzhalter, damit die Dozenten sehen, dass der Bereich kommt.
type TabKey = "infos" | "teilnehmer" | "feedback";
const TABS: { key: TabKey; label: string }[] = [
  { key: "infos", label: "Infos" },
  { key: "teilnehmer", label: "Teilnehmer" },
  { key: "feedback", label: "Feedback" },
];

const linkStyle: React.CSSProperties = { color: GRUEN_TEXT, fontWeight: 700, wordBreak: "break-all" };

// PdfAnsichtLink ist ein eigener Knopf (öffnet das PDF in der Leseansicht) und lässt
// sich nicht in AppButton hüllen — deshalb bekommt er hier genau die Maße von
// AppButton primary (05.09.2026).
const pdfKnopfStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 42, padding: "10px 22px",
  borderRadius: 999, background: TEAL, color: "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
};

// Rendert Fließtext und macht URLs, E-Mail-Adressen (mailto:) und Telefonnummern
// (tel:) klickbar – praktisch für den Ansprechpartner-Block am Handy.
function renderTextWithLinks(text: string): React.ReactNode {
  const re =
    /(https?:\/\/[^\s<>]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+\d[\d \t/().-]{5,}\d)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const tok = m[0];

    if (/^https?:/i.test(tok)) {
      const trail = tok.match(/[.,;:)\]]+$/)?.[0] ?? "";
      const url = trail ? tok.slice(0, -trail.length) : tok;
      out.push(<a key={key++} href={url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{url}</a>);
      if (trail) out.push(<span key={key++}>{trail}</span>);
    } else if (tok.includes("@")) {
      out.push(<a key={key++} href={`mailto:${tok}`} style={linkStyle}>{tok}</a>);
    } else {
      out.push(<a key={key++} href={`tel:${tok.replace(/[^\d+]/g, "")}`} style={linkStyle}>{tok.trim()}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return out;
}

// Fotos vor dem Upload auf JPEG re-encoden (fängt iPhone-HEIC ab) und
// verkleinern (max. Kante 1600px) – der Browser dekodiert, was er anzeigen kann.
async function normalizeToJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("DECODE_FAILED"));
      im.src = url;
    });
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const longest = Math.max(width, height);
    const MAX_EDGE = 1600;
    if (longest > MAX_EDGE) {
      const scale = MAX_EDGE / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("NO_CANVAS");
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("ENCODE_FAILED"))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function formatUploadDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default function DozentKurseClient({ kurse }: { kurse: DozentKurs[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(kurse.length === 1 ? kurse[0].id : null);
  const [tab, setTab] = useState<TabKey>("infos");
  const [status, setStatus] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const k of kurse) for (const p of k.participants) initial[p.id] = p.attendanceStatus;
    return initial;
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sheets, setSheets] = useState<Record<string, DozentKurs["signatureLists"]>>(() => {
    const initial: Record<string, DozentKurs["signatureLists"]> = {};
    for (const k of kurse) initial[k.id] = k.signatureLists;
    return initial;
  });
  const [uploadingKursId, setUploadingKursId] = useState<string | null>(null);
  const dateiFeldRef = useRef<HTMLInputElement>(null);

  function openKurs(id: string) {
    setSelectedId(id);
    setTab("infos");
  }

  async function uploadSignatureList(kurs: DozentKurs, fileList: FileList) {
    setError("");
    setUploadingKursId(kurs.id);
    try {
      const jpegs: Blob[] = [];
      for (const file of Array.from(fileList)) jpegs.push(await normalizeToJpeg(file));

      const fd = new FormData();
      fd.append("kurscode", kurs.matchCode);
      jpegs.forEach((b, i) => fd.append("files", b, `seite-${i + 1}.jpg`));

      const res = await fetch("/api/dozent/signature-list", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "UPLOAD_FAILED");

      const sheet = {
        id: data.sheet.id as string,
        url: `/api/dozent/signature-list/${data.sheet.id}/datei`,
        uploadedByName: data.sheet.uploadedByName as string,
        uploadedText: formatUploadDate(data.sheet.createdAt),
        pageCount: data.sheet.pageCount as number,
        mine: true,
      };
      setSheets((s) => ({ ...s, [kurs.id]: [sheet, ...(s[kurs.id] ?? [])] }));
    } catch {
      setError("Hochladen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploadingKursId(null);
    }
  }

  async function deleteSignatureList(kursId: string, id: string) {
    // Rückfrage: Die unterschriebene Liste ist der Nachweis der Anwesenheit und
    // liegt sonst nirgends. Ein Fehlgriff wäre nicht rückgängig zu machen.
    const sicher = window.confirm(
      "Unterschriebene Teilnehmerliste wirklich löschen? Die Datei wird dabei endgültig entfernt."
    );
    if (!sicher) return;

    setError("");
    try {
      const res = await fetch("/api/dozent/signature-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      setSheets((s) => ({ ...s, [kursId]: (s[kursId] ?? []).filter((x) => x.id !== id) }));
    } catch {
      setError("Löschen fehlgeschlagen. Bitte erneut versuchen.");
    }
  }

  async function setAttendance(participantId: string, newStatus: string | null) {
    const previous = status[participantId] ?? null;
    // Nochmal antippen = zurück auf „offen“.
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
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSavingId(null);
    }
  }

  const errorBanner = error ? <Meldung art="fehler">{error}</Meldung> : null;

  const selected = selectedId ? kurse.find((k) => k.id === selectedId) ?? null : null;

  // ─────────────────────────── Detail-Ansicht ───────────────────────────
  if (selected) {
    const done = selected.participants.filter((p) => status[p.id]).length;
    const anwesend = selected.participants.filter((p) => (status[p.id] ?? null) === "ANWESEND").length;
    const sheetList = sheets[selected.id] ?? [];
    const uploading = uploadingKursId === selected.id;

    return (
      <div style={{ display: "grid", gap: 14 }}>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: GRUEN_TEXT, fontWeight: 700, fontSize: "var(--t-klein)", cursor: "pointer", padding: "2px 0" }}
        >
          ← Zurück zur Übersicht
        </button>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: GRUEN_TEXT, lineHeight: "var(--lh-eng)" }}>{selected.code}</h2>
            {selected.rolle === "HOSPITATION" && <StatusBadge variant="warning">Hospitation</StatusBadge>}
            {selected.vergangen && <StatusBadge>Vergangen</StatusBadge>}
          </div>
          <div style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", marginTop: 4, lineHeight: "var(--lh-weit)" }}>{selected.title}</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", fontWeight: 600 }}>
            <span>📅 {selected.datumText}</span>
            {selected.ort && <span>📍 {selected.ort.split(",")[0]}</span>}
            <span>👥 {selected.participants.length} Teilnehmer{selected.participants.length > 0 ? ` · ${anwesend} anwesend` : ""}</span>
          </div>
        </div>

        {errorBanner}

        {/* Tab-Leiste */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--vfa-linie)", overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{ padding: "9px 16px", border: "none", background: "transparent", borderBottom: active ? `2px solid ${GRUEN_TEXT}` : "2px solid transparent", color: active ? GRUEN_TEXT : "var(--vfa-text-3)", fontWeight: 700, fontSize: "var(--t-basis)", cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap" }}
              >
                {t.label}
                {t.key === "teilnehmer" && selected.participants.length > 0 ? ` (${selected.participants.length})` : ""}
                {t.key === "feedback" && selected.feedback ? ` (${selected.feedback.count})` : ""}
              </button>
            );
          })}
        </div>

        <AppCard>
          {tab === "infos" && (
            selected.orga.length > 0 ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div className="etikett">Organisation & Logistik</div>
                {selected.orga.map((o) => {
                  const text = o.text?.trim() || "";
                  return (
                    <div key={o.id} style={{ border: "1px solid var(--vfa-linie-2)", borderRadius: 12, background: "var(--vfa-karte-2)", overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--vfa-linie-2)", background: "var(--vfa-karte-2)" }}>
                        <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text)", lineHeight: "var(--lh-eng)" }}>{o.subject || "Orga-Info"}</div>
                        <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", marginTop: 3 }}>
                          {o.fromAddress ? `${o.fromAddress} · ` : ""}{o.receivedText}
                        </div>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        {text && (
                          <div style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)", lineHeight: "var(--lh-weit)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {renderTextWithLinks(text)}
                          </div>
                        )}
                        {o.images.length > 0 && (
                          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: text ? 12 : 0 }}>
                            {o.images.map((img) => (
                              <a key={img.url} href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", border: "1px solid var(--vfa-linie)", borderRadius: 8, overflow: "hidden" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt={img.filename} style={{ display: "block", width: "100%", height: "auto" }} />
                              </a>
                            ))}
                          </div>
                        )}
                        {o.files.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: text || o.images.length > 0 ? 12 : 0 }}>
                            {o.files.map((f) => (
                              <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--vfa-linie)", background: "var(--vfa-karte)", color: "var(--vfa-text)", fontSize: "var(--t-klein)", fontWeight: 700, textDecoration: "none" }}>
                                📄 {f.filename}
                              </a>
                            ))}
                          </div>
                        )}
                        {!text && o.images.length === 0 && o.files.length === 0 && (
                          <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", fontStyle: "italic" }}>Kein Inhalt in dieser Mail.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="etikett" style={{ marginBottom: 8 }}>Organisation & Logistik</div>
                <div
                  style={{
                    padding: "16px 18px",
                    border: "1px dashed var(--vfa-linie)",
                    borderRadius: 12,
                    background: "var(--vfa-karte-2)",
                  }}
                >
                  <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text-2)" }}>
                    Für diese Schulung liegen noch keine Orga-Infos vor.
                  </div>
                  <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", marginTop: 6, lineHeight: "var(--lh-weit)" }}>
                    Sobald die Organisations- oder Bestätigungsmail zur Schulung eintrifft,
                    steht sie hier im Wortlaut, mit allem zu Hotel, Anreise,
                    Ansprechpartner und Ablauf. Bis dahin gelten die Angaben aus
                    deiner E-Mail-Korrespondenz.
                  </div>
                </div>
              </div>
            )
          )}

          {tab === "teilnehmer" && (
            <div style={{ display: "grid", gap: 18 }}>
              {/* Unterschriebene Teilnehmerliste (Foto-Upload → PDF) — oben */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div className="etikett">Unterschriebene Liste</div>
                  {/* Das Dateifeld bleibt unsichtbar; der AppButton öffnet es. */}
                  <AppButton onClick={() => dateiFeldRef.current?.click()} disabled={uploading}>
                    {uploading ? "Lädt hoch …" : "📷 Liste hochladen"}
                  </AppButton>
                  <input
                    ref={dateiFeldRef}
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files;
                      if (f && f.length) uploadSignatureList(selected, f);
                      e.currentTarget.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </div>

                {sheetList.length === 0 ? (
                  <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", lineHeight: "var(--lh-weit)" }}>
                    Noch keine Liste hochgeladen. Fotografiere die unterschriebene Teilnehmerliste. Mehrere Seiten sind möglich, sie werden zu einem PDF zusammengefasst.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {sheetList.map((sh) => (
                      <div key={sh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 10, border: "1px solid var(--vfa-linie-2)", background: "var(--vfa-karte-2)", flexWrap: "wrap" }}>
                        <a href={sh.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: GRUEN_TEXT, fontWeight: 700, fontSize: "var(--t-klein)", textDecoration: "none" }}>
                          📄 Liste · {sh.pageCount} {sh.pageCount === 1 ? "Seite" : "Seiten"}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)" }}>{sh.uploadedByName} · {sh.uploadedText}</span>
                          {sh.mine && (
                            <button type="button" onClick={() => deleteSignatureList(selected.id, sh.id)} style={{ background: "none", border: "none", color: "var(--vfa-rot-text)", fontSize: "var(--t-klein)", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                              Entfernen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Website-Anmeldungen / Anwesenheit — darunter */}
              <div style={{ borderTop: "1px solid var(--vfa-linie-2)", paddingTop: 14 }}>
                {selected.participants.length === 0 ? (
                  <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
                    Noch keine Website-Anmeldungen für diese Schulung.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, fontSize: "var(--t-label)", fontWeight: 700, color: "var(--vfa-text-3)", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>Antippen: Da / Nicht da / Krank</span>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{done}/{selected.participants.length} erfasst</span>
                    </div>

                    {selected.participants.map((p) => {
                      const current = status[p.id] ?? null;
                      return (
                        <div
                          key={p.id}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 11px", borderRadius: 10, border: "1px solid var(--vfa-linie-2)", background: "var(--vfa-karte-2)", flexWrap: "wrap" }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "var(--t-basis)", color: "var(--vfa-text)", minWidth: 100 }}>{p.name}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {STATUS_OPTIONS.map((opt) => {
                              const active = current === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={savingId === p.id}
                                  onClick={() => setAttendance(p.id, opt.value)}
                                  style={{ minHeight: 40, padding: "9px 15px", borderRadius: 999, border: active ? `1.5px solid ${opt.border}` : "1px solid var(--vfa-linie)", background: active ? opt.bg : "var(--vfa-karte)", color: active ? opt.color : "var(--vfa-text-2)", fontSize: "var(--t-klein)", fontWeight: 700, cursor: savingId === p.id ? "wait" : "pointer", opacity: savingId === p.id ? 0.6 : 1 }}
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
            </div>
          )}

          {tab === "feedback" && (
            selected.feedback ? (
              <div>
                <div className="etikett" style={{ marginBottom: 8 }}>Feedback-Auswertung</div>
                <p style={{ margin: "0 0 12px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
                  {selected.feedback.count === 1 ? "1 Rückmeldung liegt vor." : `${selected.feedback.count} Rückmeldungen liegen vor.`}
                </p>
                <PdfAnsichtLink
                  url={`/api/dozent/feedback/pdf?trainingId=${selected.feedback.trainingId}`}
                  titel="Feedback-Auswertung"
                  style={pdfKnopfStyle}
                >
                  📄 Feedback-Auswertung ansehen
                </PdfAnsichtLink>
              </div>
            ) : (
              <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
                Noch keine Feedback-Abgaben für diese Schulung.
              </div>
            )
          )}
        </AppCard>
      </div>
    );
  }

  // ─────────────────────────── Listen-Ansicht ───────────────────────────
  const upcoming = kurse.filter((k) => !k.vergangen);
  const past = kurse.filter((k) => k.vergangen);

  const renderKursCard = (kurs: DozentKurs) => {
    const anwesend = kurs.participants.filter((p) => (status[p.id] ?? null) === "ANWESEND").length;
    const istVergangen = kurs.vergangen;
    const codeColor = istVergangen ? "var(--vfa-text-3)" : GRUEN_TEXT;

    return (
      <AppCard key={kurs.id} style={{ padding: 0, overflow: "hidden", opacity: istVergangen ? 0.9 : 1 }}>
        <button
          type="button"
          onClick={() => openKurs(kurs.id)}
          style={{ width: "100%", border: "none", background: "transparent", padding: "16px 18px", cursor: "pointer", textAlign: "left", color: "inherit" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: "var(--t-gross)", fontWeight: 700, color: codeColor, lineHeight: "var(--lh-eng)" }}>
                  {kurs.code}
                </div>
                {kurs.rolle === "HOSPITATION" && <StatusBadge variant="warning">Hospitation</StatusBadge>}
              </div>
              <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", marginTop: 3, lineHeight: "var(--lh-weit)" }}>{kurs.title}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", fontWeight: 600 }}>
                <span>📅 {kurs.datumText}</span>
                {kurs.ort && <span>📍 {kurs.ort.split(",")[0]}</span>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--t-titel)", fontWeight: 750, color: codeColor, lineHeight: 1 }}>
                  {kurs.participants.length}
                </div>
                <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Teilnehmer
                </div>
                {!istVergangen && kurs.participants.length > 0 && (
                  <div style={{ fontSize: "var(--t-label)", color: GRUEN_TEXT, fontWeight: 700, marginTop: 4, whiteSpace: "nowrap" }}>
                    {anwesend} anwesend
                  </div>
                )}
                {istVergangen && kurs.feedback && (
                  <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700, marginTop: 4, whiteSpace: "nowrap" }}>
                    {kurs.feedback.count} Feedback
                  </div>
                )}
              </div>
              <div style={{ color: codeColor, fontSize: "var(--t-titel)", fontWeight: 700, lineHeight: 1 }}>›</div>
            </div>
          </div>
        </button>
      </AppCard>
    );
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {errorBanner}

      <div style={{ display: "grid", gap: 10 }}>
        <div className="etikett">Bevorstehend ({upcoming.length})</div>
        {upcoming.length === 0 ? (
          <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
            Aktuell keine bevorstehenden Schulungen.
          </div>
        ) : (
          upcoming.map(renderKursCard)
        )}
      </div>

      {past.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="etikett" style={{ color: "var(--vfa-text-3)" }}>Vergangen ({past.length})</div>
          {past.map(renderKursCard)}
        </div>
      )}
    </div>
  );
}
