"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Anforderung = { name: string; email: string; angefordertAm: string };

type Stand =
  | { art: "laedt" }
  | { art: "nachfragen"; anforderung: Anforderung }
  | { art: "bestaetigt" }
  | { art: "laeuft" }
  | { art: "fertig"; uebernommen: number }
  | { art: "fehler"; text: string };

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
      : { art: "fehler", text: "In der Adresse fehlt der Bestätigungsschlüssel." }
  );

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
          setStand({
            art: "nachfragen",
            anforderung: {
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
        if (!abgebrochen) setStand({ art: "bestaetigt" });
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
        });
      }
    } catch {
      setStand({ art: "fehler", text: "Die Bestätigung ließ sich nicht abschließen." });
    }
  }

  if (stand.art === "laedt" || stand.art === "bestaetigt") {
    return <p style={TEXT}>Einen Moment …</p>;
  }

  if (stand.art === "laeuft") {
    return <p style={TEXT}>Adresse wird bestätigt …</p>;
  }

  if (stand.art === "fehler") {
    return (
      <>
        <h1 style={TITEL}>Das hat nicht geklappt</h1>
        <p style={TEXT}>{stand.text}</p>
        <p style={TEXT}>
          Bestätigungslinks gelten 24 Stunden. Ist deiner älter, registriere dich
          bitte noch einmal.
        </p>
        <Link href="/register" style={KNOPF}>
          Zur Registrierung
        </Link>
      </>
    );
  }

  if (stand.art === "nachfragen") {
    const { anforderung } = stand;
    return (
      <>
        <h1 style={TITEL}>Bist du das?</h1>
        <p style={TEXT}>
          Zu diesem Link gehört die folgende Registrierung. Stimmt sie nicht,
          schließ die Seite einfach — dann passiert nichts.
        </p>

        <div
          style={{
            margin: "20px 0 8px",
            padding: "16px 18px",
            background: "#F7F7F4",
            border: "1px solid #E6E6E6",
            borderRadius: 12,
            textAlign: "left",
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--vfa-text)",
          }}
        >
          <div>
            <strong>Name:</strong> {anforderung.name}
          </div>
          <div>
            <strong>E-Mail:</strong> {anforderung.email}
          </div>
          <div style={{ color: "#777777", fontSize: 14 }}>
            angefordert am {zeitpunkt(anforderung.angefordertAm)} Uhr
          </div>
        </div>

        <button type="button" onClick={einloesen} style={{ ...KNOPF, border: "none", cursor: "pointer" }}>
          Ja, Konto anlegen
        </button>
      </>
    );
  }

  return (
    <>
      <h1 style={TITEL}>Adresse bestätigt</h1>
      <p style={TEXT}>
        Danke. Du kannst dich jetzt anmelden.
        {stand.uebernommen > 0
          ? ` ${stand.uebernommen === 1 ? "Eine Schulung wurde" : `${stand.uebernommen} Schulungen wurden`} deinem Konto zugeordnet.`
          : ""}
      </p>
      <Link href="/login" style={KNOPF}>
        Zur Anmeldung
      </Link>
    </>
  );
}

export default function EmailBestaetigenPage() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <Suspense fallback={<p style={TEXT}>Einen Moment …</p>}>
          <Inhalt />
        </Suspense>
      </div>
    </main>
  );
}

const TITEL: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "clamp(26px, 6vw, 34px)",
  fontWeight: 800,
  color: "var(--vfa-text)",
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
};

const TEXT: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  lineHeight: 1.6,
  color: "#666666",
};

const KNOPF: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "12px 26px",
  borderRadius: 999,
  background: "#007873",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
  marginTop: 16,
};
