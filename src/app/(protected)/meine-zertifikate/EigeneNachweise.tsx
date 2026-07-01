"use client";

import { useRef, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { DOC_CATEGORIES, MAX_DOC_BYTES, type SerializableDocument } from "@/lib/documents/service";
import { formatDate } from "@/lib/trainings/format";

const TEAL = "#007873";

const ERROR_TEXT: Record<string, string> = {
  NO_FILE: "Bitte eine Datei auswählen.",
  UNSUPPORTED_TYPE: "Nur PDF, JPG oder PNG erlaubt.",
  FILE_TOO_LARGE: "Datei ist zu groß (max. 4 MB).",
  EMPTY_FILE: "Die Datei ist leer.",
  MISSING_TITLE: "Bitte einen Titel angeben.",
  UPLOAD_FAILED: "Upload fehlgeschlagen. Bitte erneut versuchen.",
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileKindLabel(type: string): string {
  if (type === "application/pdf") return "PDF";
  if (type === "image/png") return "PNG";
  if (type === "image/jpeg") return "JPG";
  return "Datei";
}

export default function EigeneNachweise({ initialDocuments }: { initialDocuments: SerializableDocument[] }) {
  const [documents, setDocuments] = useState<SerializableDocument[]>(initialDocuments);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(DOC_CATEGORIES[0]);
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) return setError(ERROR_TEXT.NO_FILE);
    if (file.size > MAX_DOC_BYTES) return setError(ERROR_TEXT.FILE_TOO_LARGE);
    if (!title.trim()) return setError(ERROR_TEXT.MISSING_TITLE);

    const body = new FormData();
    body.append("file", file);
    body.append("title", title.trim());
    body.append("category", category);
    body.append("issuer", issuer.trim());
    body.append("issuedDate", issuedDate);

    setUploading(true);
    try {
      const res = await fetch("/api/documents", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(ERROR_TEXT[data.error] ?? "Upload fehlgeschlagen.");
        return;
      }
      setDocuments((prev) => [data.document, ...prev]);
      setTitle("");
      setIssuer("");
      setIssuedDate("");
      setCategory(DOC_CATEGORIES[0]);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Diesen Nachweis wirklich löschen?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AnimatedSection delayMs={60}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 800, color: "#1F1F1F" }}>
            Meine Nachweise
          </h2>
          <p style={{ margin: "4px 0 0", color: "#888888", fontSize: 14, lineHeight: 1.5 }}>
            Eigene Weiterbildungen, Abschlüsse und externe Nachweise – alles an einem Ort.
          </p>
        </div>

        {/* Upload-Formular */}
        <AppCard style={{ marginBottom: 16 }}>
          <form onSubmit={handleUpload} style={{ display: "grid", gap: 12 }}>
            <Field label="Titel *">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Sachkundenachweis Aufzugsmontage"
                maxLength={200}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <Field label="Kategorie">
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aussteller (optional)">
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="z. B. TÜV Süd"
                  maxLength={200}
                  style={inputStyle}
                />
              </Field>
              <Field label="Datum (optional)">
                <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <Field label="Datei (PDF, JPG oder PNG · max. 4 MB)">
              <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" style={{ fontSize: 14 }} />
            </Field>

            {error && (
              <div style={{ color: "#B00020", fontSize: 13, fontWeight: 600 }}>{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  minHeight: 44,
                  padding: "11px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: uploading ? "#8CBFBC" : TEAL,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: uploading ? "default" : "pointer",
                }}
              >
                {uploading ? "Wird hochgeladen…" : "↑ Nachweis hochladen"}
              </button>
            </div>
          </form>
        </AppCard>

        {/* Liste */}
        {documents.length === 0 ? (
          <AppCard>
            <div style={{ color: "#666666", fontSize: 14, lineHeight: 1.6 }}>
              Noch keine eigenen Nachweise hochgeladen.
            </div>
          </AppCard>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {documents.map((doc) => (
              <AppCard key={doc.id} style={{ padding: "14px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                        color: TEAL, background: "rgba(0,120,115,0.08)",
                        border: "1px solid rgba(0,120,115,0.25)", borderRadius: 6, padding: "2px 7px",
                      }}>
                        {fileKindLabel(doc.fileType)}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#1F1F1F", overflowWrap: "anywhere" }}>
                        {doc.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#888888", marginTop: 4, lineHeight: 1.5 }}>
                      {[doc.category, doc.issuer, doc.issuedDate ? formatDate(doc.issuedDate) : null, formatSize(doc.fileSize)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: `1px solid ${TEAL}`,
                        color: TEAL, fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
                      }}
                    >
                      Ansehen
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      style={{
                        padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(176,0,32,0.4)",
                        background: "transparent", color: "#B00020", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {deletingId === doc.id ? "…" : "Löschen"}
                    </button>
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #D9D9D9",
  fontSize: 14,
  color: "#1F1F1F",
  background: "#FFFFFF",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#555555" }}>{label}</span>
      {children}
    </label>
  );
}
