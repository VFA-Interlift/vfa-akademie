"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

type Anforderung = {
  /** "registrierung" = neues Konto; "adresswechsel" = bestehendes Konto zieht um. */
  typ: "registrierung" | "adresswechsel";
  name: string;
  email: string;
  angefordertAm: string;
};

/**
 * Kontext eines Fehlers — er bestimmt den angebotenen Ausweg:
 *  - "konto": Es gibt ein Konto, der Weg führt zur Anmeldung.
 *  - "registrierung": Die Registrierung ist sicher verfallen, also neu registrieren.
 *  - "unbekannt": Der Link ist nicht (mehr) bekannt. Meist wurde er schon
 *    benutzt (zweites Gerät, Mailprogramm, Zurück-Taste) — dann ist die
 *    Anmeldung der richtige Weg, nicht die Neu-Registrierung, die mit
 *    „bereits registriert“ scheitert (Befund f01-8, 05.09.2026).
 *  - "netz": Die Prüfung kam nicht durch; der Link bleibt gültig (Befund f01-20).
 */
type FehlerKontext = "registrierung" | "konto" | "unbekannt" | "netz";

type Stand =
  | { art: "laedt" }
  | { art: "nachfragen"; anforderung: Anforderung }
  | { art: "bestaetigt" }
  | { art: "laeuft" }
  | { art: "fertig"; uebernommen: number }
  | { art: "fehler"; text: string; kontext: FehlerKontext };

function zeitpunkt(iso: string) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Inhalt() {
  const params = useSearchParams();
  const token = params.get("token");
  const [stand, setStand] = useState<Stand>(
    token
      ? { art: "laedt" }
      : {
          art: "fehler",
          text: "In der Adresse fehlt der Bestätigungsschlüssel.",
          kontext: "unbekannt",
        }
  );
  // Fürs Fehlerbild: Ein gescheiterter Adresswechsel braucht den Weg zur
  // Anmeldung, keine Aufforderung zur Neu-Registrierung (Gegenprüfung 13.08.).
  const [herkunft, setHerkunft] = useState<"registrierung" | "adresswechsel" | null>(null);

  // Erst nachsehen, WAS bestätigt werden soll. Ohne diesen Schritt bestätigte
  // die Seite ungefragt — wer eine Mail anklickt, die er nie angefordert hat,
  // bekäme unbemerkt ein Konto mit fremdem Passwort.
  useEffect(() => {
    if (!token) return;

    let abgebrochen = false;

    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        if (abgebrochen) return;
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          const typ = data.art === "adresswechsel" ? "adresswechsel" : "registrierung";
          setHerkunft(typ);
          setStand({
            art: "nachfragen",
            anforderung: {
              typ,
              name: String(data.name ?? ""),
              email: String(data.email ?? ""),
              angefordertAm: String(data.angefordertAm ?? ""),
            },
          });
          return;
        }

        // Kein offener Vorgang: entweder ein Konto aus der Übergangszeit
        // (dann führt der direkte Weg zum Ziel) oder ein ungültiger Link.
        setStand({ art: "bestaetigt" });
      })
      .catch(() => {
        // Netzfehler: Der Link ist wahrscheinlich in Ordnung — vorher lief die
        // Seite hier in den Einlöseversuch und riet am Ende zur
        // Neu-Registrierung (Befund f01-20).
        if (!abgebrochen) {
          setStand({
            art: "fehler",
            text: "Der Link ließ sich gerade nicht prüfen. Bitte lade die Seite neu.",
            kontext: "netz",
          });
        }
      });

    return () => {
      abgebrochen = true;
    };
  }, [token]);

  // Übergangsfall ohne Anforderungsdaten: direkt einlösen.
  useEffect(() => {
    if (stand.art !== "bestaetigt" || !token) return;
    einloesen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stand.art]);

  async function einloesen() {
    if (!token) return;
    setStand({ art: "laeuft" });

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setStand({ art: "fertig", uebernommen: Number(data.uebernommeneSchulungen ?? 0) });
      } else {
        setStand({
          art: "fehler",
          text: String(data.error ?? "Der Link ist ungültig oder abgelaufen."),
          kontext:
            data.kontext === "konto" || herkunft === "adresswechsel"
              ? "konto"
              : data.kontext === "registrierung"
                ? "registrierung"
                : "unbekannt",
        });
      }
    } catch {
      setStand({
        art: "fehler",
        text: "Die Bestätigung ließ sich nicht abschließen. Bitte lade die Seite neu und versuch es noch einmal.",
        kontext: "netz",
      });
    }
  }

  if (stand.art === "laedt" || stand.art === "bestaetigt") {
    return <p style={UNTERTITEL}>Einen Moment …</p>;
  }

  if (stand.art === "laeuft") {
    return <p style={UNTERTITEL}>Adresse wird bestätigt …</p>;
  }

  if (stand.art === "fehler") {
    return (
      <>
        <p style={UNTERTITEL}>Das hat nicht geklappt.</p>
        <AppCard>
          <div style={{ display: "grid", gap: 18 }}>
            <Meldung art="fehler">{stand.text}</Meldung>

            {stand.kontext === "netz" && (
              <AppButton onClick={() => window.location.reload()} variant="primary" fullWidth>
                Seite neu laden
              </AppButton>
            )}

            {stand.kontext === "konto" && (
              // Hier existiert ein Konto — eine Neu-Registrierung wäre der
              // falsche Weg (sie scheitert an der vergebenen Adresse oder
              // legt ein Zweitkonto an).
              <AppButton href="/login" variant="primary" fullWidth>
                Zur Anmeldung
              </AppButton>
            )}

            {stand.kontext === "registrierung" && (
              <>
                <p style={KARTENTEXT}>
                  Bestätigungslinks gelten 24 Stunden. Ist deiner älter, registriere dich
                  bitte noch einmal.
                </p>
                <AppButton href="/register" variant="primary" fullWidth>
                  Zur Registrierung
                </AppButton>
              </>
            )}

            {stand.kontext === "unbekannt" && (
              <>
                <p style={KARTENTEXT}>
                  Hast du den Link schon benutzt, melde dich einfach an. Bestätigungslinks
                  gelten 24 Stunden; ist deiner älter, registriere dich bitte noch einmal.
                </p>
                <AppButton href="/login" variant="primary" fullWidth>
                  Zur Anmeldung
                </AppButton>
                <AppButton href="/register" variant="secondary" fullWidth>
                  Zur Registrierung
                </AppButton>
              </>
            )}
          </div>
        </AppCard>
      </>
    );
  }

  if (stand.art === "nachfragen") {
    const { anforderung } = stand;
    const wechsel = anforderung.typ === "adresswechsel";
    return (
      <>
        <p style={UNTERTITEL}>
          {wechsel
            ? "Ein bestehendes VFA-Akademie-Konto möchte künftig diese E-Mail-Adresse " +
              "als Anmeldeadresse verwenden. Warst du das nicht, schließ die Seite " +
              "einfach, dann bleibt alles beim Alten."
            : "Zu diesem Link gehört die folgende Registrierung. Stimmt sie nicht, " +
              "schließ die Seite einfach, dann passiert nichts."}
        </p>
        <AppCard>
          <div style={{ display: "grid", gap: 18 }}>
            <h2 style={KARTENTITEL}>Bist du das?</h2>

            {/* Token statt Festfarben: Der Kasten blieb im Dunkelmodus hell,
                die Schrift darin wurde hell — unlesbar (Befund f01-4). */}
            <div
              style={{
                padding: "14px 16px",
                background: "var(--vfa-karte-2)",
                border: "1px solid var(--vfa-linie)",
                borderRadius: 10,
                fontSize: "var(--t-basis)",
                lineHeight: "var(--lh-weit)",
                color: "var(--vfa-text)",
              }}
            >
              <div>
                <strong>Name:</strong> {anforderung.name}
              </div>
              <div>
                <strong>{wechsel ? "Neue E-Mail:" : "E-Mail:"}</strong> {anforderung.email}
              </div>
              <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)" }}>
                angefordert am {zeitpunkt(anforderung.angefordertAm)} Uhr
              </div>
            </div>

            <AppButton onClick={einloesen} variant="primary" fullWidth>
              {wechsel ? "Ja, neue Adresse bestätigen" : "Ja, Konto anlegen"}
            </AppButton>
          </div>
        </AppCard>
      </>
    );
  }

  return (
    <>
      <p style={UNTERTITEL}>Danke, deine Adresse ist bestätigt.</p>
      <AppCard>
        <div style={{ display: "grid", gap: 18 }}>
          <Meldung art="erfolg">
            {herkunft === "adresswechsel"
              ? "Dein Konto läuft ab jetzt unter der neuen Adresse. Melde dich damit an."
              : "Du kannst dich jetzt anmelden."}
            {stand.uebernommen > 0
              ? ` ${stand.uebernommen === 1 ? "Eine Schulung wurde" : `${stand.uebernommen} Schulungen wurden`} deinem Konto zugeordnet.`
              : ""}
          </Meldung>
          <AppButton href="/login" variant="primary" fullWidth>
            Zur Anmeldung
          </AppButton>
        </div>
      </AppCard>
    </>
  );
}

export default function EmailBestaetigenPage() {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <PageHeader title="E-Mail bestätigen" />

        <Suspense fallback={<p style={UNTERTITEL}>Einen Moment …</p>}>
          <Inhalt />
        </Suspense>

        <p style={FUSSZEILE}>
          <Link href="/login" style={FUSSLINK}>
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}

const UNTERTITEL: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "var(--t-basis)",
  lineHeight: "var(--lh-weit)",
  color: "var(--vfa-text-2)",
};

const KARTENTITEL: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--t-gross)",
  fontWeight: 700,
  lineHeight: "var(--lh-eng)",
  color: "var(--vfa-gruen-text)",
};

const KARTENTEXT: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--t-basis)",
  lineHeight: "var(--lh-weit)",
  color: "var(--vfa-text)",
};

const FUSSZEILE: React.CSSProperties = {
  marginTop: 20,
  textAlign: "center",
  fontSize: "var(--t-klein)",
  color: "var(--vfa-text-2)",
};

const FUSSLINK: React.CSSProperties = {
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
