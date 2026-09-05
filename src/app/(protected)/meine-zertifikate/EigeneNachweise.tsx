"use client";

import { useMemo, useRef, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import Meldung from "@/components/ui/Meldung";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PdfAnsichtLink from "@/components/PdfAnsichtLink";
import { DOC_CATEGORIES, MAX_DOC_BYTES, type SerializableDocument } from "@/lib/documents/service";
import { formatDate } from "@/lib/trainings/format";

// Die Standardsortierung (neueste zuerst) ist der Platzhalter von AppSelect
// (Wert ""); die drei anderen stehen als Optionen darunter (05.09.2026).
type SortKey = "" | "datum-alt" | "titel" | "kategorie";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "datum-alt", label: "Datum (älteste zuerst)" },
  { value: "titel", label: "Titel (A–Z)" },
  { value: "kategorie", label: "Kategorie (A–Z)" },
];

const ERROR_TEXT: Record<string, string> = {
  NO_FILE: "Bitte eine Datei auswählen.",
  UNSUPPORTED_TYPE: "Nur PDF, JPG oder PNG erlaubt.",
  FILE_TOO_LARGE: "Datei ist zu groß (max. 4 MB).",
  EMPTY_FILE: "Die Datei ist leer.",
  MISSING_TITLE: "Bitte einen Titel angeben.",
  UPLOAD_FAILED: "Hochladen fehlgeschlagen. Bitte erneut versuchen.",
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

/** Dateiname für den Herunterladen-Knopf in der App-Ansicht. */
function dateinameFuer(doc: SerializableDocument): string {
  const endung = fileKindLabel(doc.fileType).toLowerCase();
  return endung === "datei" ? doc.title : `${doc.title}.${endung}`;
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
  // "" = alle Kategorien (Platzhalter von AppSelect).
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const availableCategories = useMemo(() => {
    const values = documents.map((d) => d.category).filter((c): c is string => Boolean(c));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "de"));
  }, [documents]);

  const visibleDocuments = useMemo(() => {
    const filtered =
      categoryFilter === ""
        ? documents
        : documents.filter((d) => (d.category ?? "") === categoryFilter);

    const time = (value: string | null) => {
      const t = value ? new Date(value).getTime() : NaN;
      return Number.isNaN(t) ? 0 : t;
    };

    const sorted = [...filtered];
    switch (sortKey) {
      case "datum-alt":
        sorted.sort((a, b) => time(a.issuedDate) - time(b.issuedDate));
        break;
      case "titel":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "de"));
        break;
      case "kategorie":
        sorted.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "", "de"));
        break;
      default:
        sorted.sort((a, b) => time(b.issuedDate) - time(a.issuedDate));
    }
    return sorted;
  }, [documents, categoryFilter, sortKey]);

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
        setError(ERROR_TEXT[data.error] ?? "Hochladen fehlgeschlagen. Bitte erneut versuchen.");
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
    setError("");
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        // Vorher wurde der Fehlschlag verschluckt: Der Nachweis blieb stehen,
        // ohne dass jemand erfuhr, warum.
        setError("Der Nachweis ließ sich nicht löschen. Bitte erneut versuchen.");
      }
    } catch {
      setError("Netzwerkfehler beim Löschen. Bitte erneut versuchen.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AnimatedSection delayMs={60}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Etikett statt zweiter Seitenüberschrift: Der Titel steht im Band,
            der Tab heißt schon „Meine Nachweise“ (Launch-Runde 05.09.2026). */}
        <div style={{ marginBottom: 12 }}>
          <div className="etikett">Meine Nachweise</div>
          <p style={{ margin: "4px 0 0", color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", lineHeight: "var(--lh-weit)" }}>
            Eigene Weiterbildungen, Abschlüsse und externe Nachweise – alles an einem Ort.
          </p>
        </div>

        {/* Upload-Formular */}
        <AppCard style={{ marginBottom: 16 }}>
          <form onSubmit={handleUpload} style={{ display: "grid", gap: 12 }}>
            <AppInput
              label="Titel *"
              value={title}
              onChange={setTitle}
              placeholder="z. B. Sachkundenachweis Aufzugsmontage"
            />

            <AppSelect
              label="Kategorie"
              value={category}
              onChange={setCategory}
              options={DOC_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="Keine Kategorie"
            />

            <AppInput
              label="Aussteller (optional)"
              value={issuer}
              onChange={setIssuer}
              placeholder="z. B. TÜV Süd"
            />

            <AppInput label="Datum (optional)" type="date" value={issuedDate} onChange={setIssuedDate} />

            <Field label="Datei (PDF, JPG oder PNG · max. 4 MB)">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="vfa-input"
                style={dateiFeldStyle}
              />
            </Field>

            {error && <Meldung art="fehler">{error}</Meldung>}

            <div>
              <AppButton type="submit" disabled={uploading}>
                {uploading ? "Wird hochgeladen …" : "Nachweis hochladen"}
              </AppButton>
            </div>
          </form>
        </AppCard>

        {/* Filter & Sortierung */}
        {documents.length > 0 && (
          <AppCard style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 150px", minWidth: 150 }}>
                <AppSelect
                  label="Kategorie"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={availableCategories.map((c) => ({ value: c, label: c }))}
                  placeholder="Alle Kategorien"
                />
              </div>

              <div style={{ flex: "1 1 180px", minWidth: 180 }}>
                <AppSelect
                  label="Sortieren nach"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as SortKey)}
                  options={SORT_OPTIONS}
                  placeholder="Datum (neueste zuerst)"
                />
              </div>
            </div>
          </AppCard>
        )}

        {/* Liste */}
        {documents.length === 0 ? (
          <AppCard>
            <div style={{ color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
              Noch keine eigenen Nachweise hochgeladen.
            </div>
          </AppCard>
        ) : visibleDocuments.length === 0 ? (
          <AppCard>
            <div style={{ color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
              Für diese Kategorie wurden keine Nachweise gefunden.
            </div>
          </AppCard>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {visibleDocuments.map((doc) => (
              <AppCard key={doc.id} style={{ padding: "14px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "var(--t-label)", fontWeight: 700, letterSpacing: "0.06em",
                        color: "var(--vfa-gruen-text)", background: "rgba(0,120,115,0.08)",
                        border: "1px solid rgba(0,120,115,0.25)", borderRadius: 6, padding: "2px 7px",
                      }}>
                        {fileKindLabel(doc.fileType)}
                      </span>
                      <h2 style={{
                        margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)",
                        color: "var(--vfa-gruen-text)", overflowWrap: "anywhere",
                      }}>
                        {doc.title}
                      </h2>
                    </div>
                    <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", marginTop: 4, lineHeight: "var(--lh-weit)" }}>
                      {[doc.category, doc.issuer, doc.issuedDate ? formatDate(doc.issuedDate) : null, formatSize(doc.fileSize)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {/* In der App ansehen, mit X zurück (Tobis Vorgabe vom
                        12.08.2026) — gilt auch für JPG und PNG, das iframe
                        zeigt Bilder genauso. */}
                    <PdfAnsichtLink
                      url={`/api/documents/${doc.id}/datei`}
                      titel={doc.title}
                      dateiname={dateinameFuer(doc)}
                      knopf="ghost"
                    >
                      Ansehen
                    </PdfAnsichtLink>
                    <AppButton
                      variant="danger"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? "…" : "Löschen"}
                    </AppButton>
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

// Dateifeld mit den Maßen von AppInput (AppInput kennt type="file" nicht,
// weil es einen Wert erwartet; der Dateiwähler hat keinen).
const dateiFeldStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid var(--vfa-linie)",
  fontSize: 15,
  color: "var(--vfa-text)",
  background: "var(--vfa-karte)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", color: "var(--vfa-text-2)" }}>{label}</span>
      {children}
    </label>
  );
}
