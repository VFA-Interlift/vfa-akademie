"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";

type Bericht = {
  schulungen: { gelesen: number; ohneDatum: number; mitTeilnehmern: number; neu: number; aktualisiert: number };
  teilnehmer: {
    gelesen: number;
    uebersprungen: number;
    uebersprungenNachArt: Record<string, number>;
    ohneEmail: number;
    ohneSchulung: number;
    neu: number;
    aktualisiert: number;
  };
  personen: number;
  warnungen: string[];
  beispiele: Array<{ cobraId: string; code: string; titel: string; start: string; teilnehmer: number }>;
};

type Modus = "vorschau" | "import";

/** Lesbare Texte für die Fehlercodes der Import-Route; unbekannte Codes bleiben roh. */
const FEHLERTEXTE: Record<string, string> = {
  BEIDE_DATEIEN_NOETIG: "Bitte beide Dateien auswählen.",
  INVALID_FORM: "Die Dateien konnten nicht übertragen werden.",
  KEINE_SCHULUNGEN_ERKANNT: "In der Schulungsdatei wurde keine Schulung erkannt. Ist es der richtige Cobra-Export?",
  KEINE_TEILNEHMER_ERKANNT: "In der Teilnehmerdatei wurde kein Teilnehmer erkannt. Ist es der richtige Cobra-Export?",
  IMPORT_FEHLGESCHLAGEN: "Der Import ist fehlgeschlagen.",
};

// Wie AppInput, nur für Dateifelder — die gibt es dort nicht.
const dateifeldStil: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid var(--vfa-linie)",
  background: "var(--vfa-karte)",
  color: "var(--vfa-text)",
  fontSize: 15,
};

export default function ImportClient() {
  const [schulungen, setSchulungen] = useState<File | null>(null);
  const [teilnehmer, setTeilnehmer] = useState<File | null>(null);
  // Welcher Lauf gerade arbeitet — damit nur der passende Knopf seinen Text wechselt.
  const [laeuft, setLaeuft] = useState<Modus | null>(null);
  const [bericht, setBericht] = useState<Bericht | null>(null);
  const [geschrieben, setGeschrieben] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  // Neue Datei gewählt: die alte Vorschau gilt nicht mehr, der Import-Knopf
  // darf erst nach einer neuen Vorschau wieder erscheinen.
  function dateiWaehlen(setzer: (f: File | null) => void, datei: File | null) {
    setzer(datei);
    setBericht(null);
    setGeschrieben(false);
  }

  async function senden(modus: Modus) {
    if (!schulungen || !teilnehmer) {
      setFehler("Bitte beide Dateien auswählen.");
      return;
    }

    // Rückfrage nur beim echten Schreiben — die Vorschau ändert nichts.
    if (modus === "import") {
      const sicher = window.confirm(
        "Import jetzt in die Datenbank schreiben? Die Vorschau zeigt, was angelegt wird. Rückgängig machen lässt sich der Schritt nicht."
      );
      if (!sicher) return;
    }

    setLaeuft(modus);
    setFehler(null);

    const fd = new FormData();
    fd.append("schulungen", schulungen);
    fd.append("teilnehmer", teilnehmer);
    fd.append("modus", modus);

    try {
      const res = await fetch("/api/admin/import/cobra", { method: "POST", body: fd });
      // Antwortet die Plattform statt der Route (zu große Datei, Zeitüberschreitung),
      // kommt kein JSON — dann eine verständliche Meldung statt des Parser-Fehlers.
      const istJson = (res.headers.get("content-type") ?? "").includes("application/json");
      if (!istJson) {
        setFehler(`Der Server hat nicht wie erwartet geantwortet (Status ${res.status}). Ist eine Datei zu groß?`);
        setBericht(null);
        return;
      }
      const data = await res.json();
      if (!data.ok) {
        const text = FEHLERTEXTE[String(data.error)] ?? String(data.error);
        setFehler(`${text}${data.details ? " (" + data.details + ")" : ""}`);
        setBericht(null);
      } else {
        setBericht(data.bericht);
        setGeschrieben(Boolean(data.geschrieben));
      }
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setLaeuft(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AppCard>
        <h2 style={{ margin: "0 0 4px", fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>Dateien auswählen</h2>
        <p style={{ margin: "0 0 16px", color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
          Zwei Cobra-Exporte im Excel-Format. Die Schulungsdatei enthält ID, Titel, Start- und
          Enddatum, die Teilnehmerdatei die nach Schulung gruppierten Personen.
        </p>

        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--vfa-text-2)", letterSpacing: "0.01em" }}>
            1. Schulungen (mit Datum)
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="vfa-input"
            onChange={(e) => dateiWaehlen(setSchulungen, e.target.files?.[0] ?? null)}
            style={dateifeldStil}
          />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--vfa-text-2)", letterSpacing: "0.01em" }}>
            2. Teilnehmer (nach Schulung gruppiert)
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="vfa-input"
            onChange={(e) => dateiWaehlen(setTeilnehmer, e.target.files?.[0] ?? null)}
            style={dateifeldStil}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AppButton variant="ghost" onClick={() => senden("vorschau")} disabled={laeuft !== null}>
            {laeuft === "vorschau" ? "Wird geprüft …" : "Vorschau"}
          </AppButton>

          {bericht && !geschrieben ? (
            <AppButton variant="primary" onClick={() => senden("import")} disabled={laeuft !== null}>
              {laeuft === "import" ? "Wird geschrieben …" : "Import jetzt ausführen"}
            </AppButton>
          ) : null}
        </div>
      </AppCard>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}

      {bericht ? (
        <AppCard>
          <h2 style={{ margin: "0 0 12px", fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>
            {geschrieben ? "Import abgeschlossen" : "Vorschau — es wurde nichts geschrieben"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            <Kennzahl label="Schulungen gelesen" wert={bericht.schulungen.gelesen} />
            <Kennzahl label="davon mit Teilnehmern" wert={bericht.schulungen.mitTeilnehmern} />
            <Kennzahl label="Schulungen neu" wert={bericht.schulungen.neu} />
            <Kennzahl label="Schulungen aktualisiert" wert={bericht.schulungen.aktualisiert} />
            <Kennzahl label="Teilnehmer neu" wert={bericht.teilnehmer.neu} />
            <Kennzahl label="Teilnehmer aktualisiert" wert={bericht.teilnehmer.aktualisiert} />
            <Kennzahl label="verschiedene Personen" wert={bericht.personen} />
            <Kennzahl label="ohne E-Mail" wert={bericht.teilnehmer.ohneEmail} />
          </div>

          {Object.keys(bericht.teilnehmer.uebersprungenNachArt).length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div className="etikett" style={{ marginBottom: 6 }}>
                Übersprungen ({bericht.teilnehmer.uebersprungen}) — keine echten Teilnahmen
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: 1.7 }}>
                {Object.entries(bericht.teilnehmer.uebersprungenNachArt).map(([art, n]) => (
                  <li key={art}>
                    {art}: {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {bericht.warnungen.length > 0 ? (
            <div style={{ marginBottom: 16, padding: "10px 12px", background: "rgba(255,193,0,0.12)", border: "1px solid var(--vfa-yellow)", borderRadius: 8 }}>
              {bericht.warnungen.map((w, i) => (
                <div key={i} style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>{w}</div>
              ))}
            </div>
          ) : null}

          <div className="etikett" style={{ marginBottom: 6 }}>Stichprobe</div>
          <div style={{ display: "grid", gap: 6 }}>
            {bericht.beispiele.map((b) => (
              <div key={b.cobraId} style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)" }}>
                #{b.cobraId} · {b.start} · {b.code || "—"} · {b.titel} · {b.teilnehmer} TN
              </div>
            ))}
          </div>

          {geschrieben ? (
            <p style={{ marginTop: 16, marginBottom: 0, fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: 1.7 }}>
              Die Teilnehmer liegen jetzt in der App. Anmeldungen entstehen automatisch, sobald
              jemand mit der passenden E-Mail-Adresse seine Registrierung bestätigt. Für bereits
              registrierte Nutzer geschieht das nicht rückwirkend — dort hilft nur, die
              Anmeldung unter „Nutzer verwalten“ von Hand zu setzen.
            </p>
          ) : null}
        </AppCard>
      ) : null}
    </div>
  );
}

function Kennzahl({ label, wert }: { label: string; wert: number }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--vfa-karte-2)", borderRadius: 8 }}>
      <div className="etikett">{label}</div>
      <div className="kennzahl" style={{ marginTop: 4 }}>{wert}</div>
    </div>
  );
}
