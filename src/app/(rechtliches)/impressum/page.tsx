import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – VFA-Akademie",
};

/**
 * Angaben übernommen aus dem Impressum von vfa-interlift.de (Stand 03.08.2026).
 *
 * NOCH ZU BESTÄTIGEN: Betreiberin dieser App ist hier die VFA-Akademie gGmbH,
 * weil die App Akademie-Schulungen abbildet. Ist stattdessen der VFA-Interlift
 * e.V. Betreiber, muss der Block getauscht werden (e.V., Vereinsregister
 * VR 12296, Registergericht München, vertreten durch Achim Hütter).
 */
const ABSCHNITT: React.CSSProperties = { marginTop: 32 };
const TITEL: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "#007873",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 8,
};
const TEXT: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "#333333", margin: 0 };

export default function ImpressumPage() {
  return (
    <article>
      <h1
        style={{
          fontSize: "clamp(28px, 6vw, 38px)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
          color: "#1F1F1F",
        }}
      >
        Impressum
      </h1>
      <p style={{ ...TEXT, color: "#888888" }}>Angaben gemäß § 5 DDG</p>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Anbieterin</div>
        <p style={TEXT}>
          VFA-Akademie gGmbH
          <br />
          Süderstraße 282
          <br />
          20537 Hamburg
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Vertreten durch</div>
        <p style={TEXT}>Geschäftsführer: Andreas Hönnige</p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Kontakt</div>
        <p style={TEXT}>
          Telefon: +49 40 8000473-0
          <br />
          E-Mail:{" "}
          <a href="mailto:info@vfa-interlift.de" style={{ color: "#007873" }}>
            info@vfa-interlift.de
          </a>
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Registereintrag</div>
        <p style={TEXT}>
          Handelsregister: HRB 155315
          <br />
          Registergericht: Amtsgericht Hamburg
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Umsatzsteuer-Identifikationsnummer</div>
        <p style={TEXT}>DE220846803</p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Verbraucherstreitbeilegung</div>
        <p style={TEXT}>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Haftung für Inhalte</div>
        <p style={TEXT}>
          Als Diensteanbieterin sind wir für eigene Inhalte in dieser Anwendung nach
          den allgemeinen Gesetzen verantwortlich. Wir sind nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
          Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen
          nach den allgemeinen Gesetzen bleiben hiervon unberührt. Sobald uns
          konkrete Rechtsverletzungen bekannt werden, entfernen wir die Inhalte
          umgehend.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Urheberrecht</div>
        <p style={TEXT}>
          Die durch uns erstellten Inhalte und Werke in dieser Anwendung unterliegen
          dem deutschen Urheberrecht. Ausgestellte Teilnahmebestätigungen und
          Zertifikate sind ausschließlich für die darin genannte Person bestimmt.
        </p>
      </section>
    </article>
  );
}
