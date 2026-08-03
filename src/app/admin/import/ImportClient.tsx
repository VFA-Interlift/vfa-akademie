"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";

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

export default function ImportClient() {
  const [schulungen, setSchulungen] = useState<File | null>(null);
  const [teilnehmer, setTeilnehmer] = useState<File | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [bericht, setBericht] = useState<Bericht | null>(null);
  const [geschrieben, setGeschrieben] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function senden(modus: "vorschau" | "import") {
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

    setLaeuft(true);
    setFehler(null);

    const fd = new FormData();
    fd.append("schulungen", schulungen);
    fd.append("teilnehmer", teilnehmer);
    fd.append("modus", modus);

    try {
      const res = await fetch("/api/admin/import/cobra", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        setFehler(`${data.error}${data.details ? ": " + data.details : ""}`);
        setBericht(null);
      } else {
        setBericht(data.bericht);
        setGeschrieben(Boolean(data.geschrieben));
      }
    } catch (e) {
      setFehler(e instanceof Error ? e.message : String(e));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AppCard>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>Dateien auswählen</h2>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 14, lineHeight: 1.6 }}>
          Zwei Cobra-Exporte im Excel-Format. Die Schulungsdatei enthält ID, Titel, Start- und
          Enddatum, die Teilnehmerdatei die nach Schulung gruppierten Personen.
        </p>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            1. Schulungen (mit Datum)
          </span>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setSchulungen(e.target.files?.[0] ?? null)}
            style={{ fontSize: 14 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 18 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            2. Teilnehmer (nach Schulung gruppiert)
          </span>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setTeilnehmer(e.target.files?.[0] ?? null)}
            style={{ fontSize: 14 }}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => senden("vorschau")}
            disabled={laeuft}
            style={{
              padding: "10px 18px", fontWeight: 800, fontSize: 14, cursor: laeuft ? "default" : "pointer",
              border: "1px solid #007873", background: "#FFFFFF", color: "#007873", borderRadius: 8,
            }}
          >
            {laeuft ? "Wird geprüft..." : "Vorschau"}
          </button>

          {bericht && !geschrieben ? (
            <button
              onClick={() => senden("import")}
              disabled={laeuft}
              style={{
                padding: "10px 18px", fontWeight: 800, fontSize: 14, cursor: laeuft ? "default" : "pointer",
                border: "none", background: "#007873", color: "#FFFFFF", borderRadius: 8,
              }}
            >
              Import jetzt ausführen
            </button>
          ) : null}
        </div>
      </AppCard>

      {fehler ? (
        <AppCard>
          <div style={{ color: "#B00020", fontWeight: 700 }}>Fehler: {fehler}</div>
        </AppCard>
      ) : null}

      {bericht ? (
        <AppCard>
          <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800 }}>
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
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                Übersprungen ({bericht.teilnehmer.uebersprungen}) — keine echten Teilnahmen
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#555", fontSize: 14, lineHeight: 1.7 }}>
                {Object.entries(bericht.teilnehmer.uebersprungenNachArt).map(([art, n]) => (
                  <li key={art}>
                    {art}: {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {bericht.warnungen.length > 0 ? (
            <div style={{ marginBottom: 16, padding: "10px 12px", background: "#FFF6E0", border: "1px solid #FFC100", borderRadius: 8 }}>
              {bericht.warnungen.map((w, i) => (
                <div key={i} style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{w}</div>
              ))}
            </div>
          ) : null}

          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Stichprobe</div>
          <div style={{ display: "grid", gap: 6 }}>
            {bericht.beispiele.map((b) => (
              <div key={b.cobraId} style={{ fontSize: 13, color: "#555", fontFamily: "ui-monospace, monospace" }}>
                #{b.cobraId} · {b.start} · {b.code || "—"} · {b.titel} · {b.teilnehmer} TN
              </div>
            ))}
          </div>

          {geschrieben ? (
            <p style={{ marginTop: 16, marginBottom: 0, fontSize: 14, color: "#555", lineHeight: 1.7 }}>
              Die Teilnehmer liegen jetzt in der App. Anmeldungen entstehen automatisch, sobald sich
              jemand mit der passenden E-Mail-Adresse registriert. Für bereits registrierte Nutzer
              kannst du den Abgleich manuell anstoßen.
            </p>
          ) : null}
        </AppCard>
      ) : null}
    </div>
  );
}

function Kennzahl({ label, wert }: { label: string; wert: number }) {
  return (
    <div style={{ padding: "10px 12px", background: "#F7F7F7", borderRadius: 8 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1F1F1F" }}>{wert}</div>
      <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}
