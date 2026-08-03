"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Stand =
  | { art: "laeuft" }
  | { art: "fertig"; uebernommen: number }
  | { art: "fehler"; text: string };

function Inhalt() {
  const params = useSearchParams();
  const token = params.get("token");
  // Der Fehlzustand für den fehlenden Schlüssel steht schon im Anfangswert —
  // im Effect gesetzt würde er eine zweite Darstellung auslösen.
  const [stand, setStand] = useState<Stand>(
    token
      ? { art: "laeuft" }
      : { art: "fehler", text: "In der Adresse fehlt der Bestätigungsschlüssel." }
  );

  useEffect(() => {
    if (!token) return;

    let abgebrochen = false;

    fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (abgebrochen) return;

        if (res.ok && data.ok) {
          setStand({ art: "fertig", uebernommen: Number(data.uebernommeneSchulungen ?? 0) });
        } else {
          setStand({
            art: "fehler",
            text: String(data.error ?? "Der Link ist ungültig oder abgelaufen."),
          });
        }
      })
      .catch(() => {
        if (!abgebrochen) {
          setStand({ art: "fehler", text: "Die Bestätigung ließ sich nicht abschließen." });
        }
      });

    return () => {
      abgebrochen = true;
    };
  }, [token]);

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
          bitte noch einmal mit derselben Adresse.
        </p>
        <Link href="/register" style={KNOPF}>
          Zur Registrierung
        </Link>
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
        <Suspense fallback={<p style={TEXT}>Adresse wird bestätigt …</p>}>
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
  color: "#1F1F1F",
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
