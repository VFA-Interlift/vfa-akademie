import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz – VFA-Akademie",
};

/**
 * Beschreibt, was die App tatsächlich verarbeitet — aus dem Datenmodell und den
 * Schnittstellen abgeleitet, nicht aus einer Mustervorlage.
 *
 * VOR DEM ECHTBETRIEB PRÜFEN LASSEN: Auftragsverarbeitungsverträge mit Vercel
 * (Betrieb, Datenbank, Dateispeicher) und Resend (Mailversand), außerdem ob ein
 * Datenschutzbeauftragter benannt ist. Beides ist hier bewusst offen gelassen
 * statt geraten.
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
const TEXT: React.CSSProperties = { fontSize: 15, lineHeight: 1.7, color: "#333333", margin: "0 0 12px" };
const LISTE: React.CSSProperties = { ...TEXT, paddingLeft: 20 };

export default function DatenschutzPage() {
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
        Datenschutzerklärung
      </h1>
      <p style={{ ...TEXT, color: "#888888" }}>
        Information nach Art. 13 und 14 DSGVO für die App der VFA-Akademie
      </p>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Verantwortliche</div>
        <p style={TEXT}>
          VFA-Akademie gGmbH, Süderstraße 282, 20537 Hamburg
          <br />
          Telefon +49 40 8000473-0, E-Mail{" "}
          <a href="mailto:info@vfa-interlift.de" style={{ color: "#007873" }}>
            info@vfa-interlift.de
          </a>
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Welche Daten wir verarbeiten</div>
        <p style={TEXT}>Bei der Registrierung und im Profil:</p>
        <ul style={LISTE}>
          <li>Name, E-Mail-Adresse und Passwort (nur als nicht rückrechenbarer Prüfwert gespeichert)</li>
          <li>Geburtsdatum — es steht auf Teilnahmebestätigungen und Zertifikaten und macht Namensgleiche unterscheidbar</li>
          <li>freiwillig: Telefonnummer, Anrede, Firma mit Anschrift und Position</li>
        </ul>
        <p style={TEXT}>Durch die Nutzung entstehen zusätzlich:</p>
        <ul style={LISTE}>
          <li>Anmeldungen zu Schulungen und deren Stand, Anwesenheit, ausgestellte Zertifikate</li>
          <li>Credits und ihre Buchungen</li>
          <li>Rückmeldungen zu besuchten Schulungen</li>
          <li>selbst hochgeladene Nachweise über Weiterbildungen</li>
          <li>Zeitpunkt der letzten Anmeldung</li>
        </ul>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Woher die Daten stammen</div>
        <p style={TEXT}>
          Neben deinen eigenen Eingaben erhalten wir Anmeldedaten aus dem
          Anmeldeformular auf vfa-interlift.de und aus der Verbandsverwaltung. Stimmt
          die dort hinterlegte E-Mail-Adresse mit deinem Konto überein, erscheinen die
          zugehörigen Schulungen automatisch in der App.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Wozu und auf welcher Grundlage</div>
        <ul style={LISTE}>
          <li>
            <strong>Durchführung der Schulung und Ausstellung der Nachweise</strong> —
            Art. 6 Abs. 1 lit. b DSGVO (Vertrag)
          </li>
          <li>
            <strong>Nachweisführung über durchgeführte Schulungen</strong> — Art. 6
            Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)
          </li>
          <li>
            <strong>Erinnerungen vor einer Schulung</strong> — Art. 6 Abs. 1 lit. f
            DSGVO. Du kannst sie jederzeit unter Einstellungen abschalten.
          </li>
          <li>
            <strong>Rückmeldungen zu Schulungen und Credits</strong> — Art. 6 Abs. 1
            lit. f DSGVO (Qualitätssicherung). Die Abgabe ist freiwillig.
          </li>
        </ul>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Ranking</div>
        <p style={TEXT}>
          Das Ranking zeigt ausschließlich anonyme Werte: den ersten Platz ohne Namen,
          deine eigene Platzierung und den Mittelwert aller Teilnehmenden. Andere
          Personen sind dort nicht erkennbar.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Wer die Daten sonst noch sieht</div>
        <ul style={LISTE}>
          <li>
            <strong>Dozentinnen und Dozenten</strong> sehen die Teilnehmenden ihrer
            eigenen Schulung und tragen dort die Anwesenheit ein. Rückmeldungen sehen
            sie nur zusammengefasst.
          </li>
          <li>
            <strong>Die Geschäftsstelle</strong> verwaltet Konten, Schulungen und
            Zertifikate.
          </li>
          <li>
            <strong>Technische Dienstleister</strong> im Auftrag: der Betreiber der
            Anwendung samt Datenbank und Dateispeicher sowie der Versanddienst für
            E-Mails. Beide verarbeiten die Daten weisungsgebunden in unserem Auftrag.
          </li>
        </ul>
        <p style={TEXT}>Eine Weitergabe zu Werbezwecken findet nicht statt.</p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Wie lange wir speichern</div>
        <p style={TEXT}>
          Kontodaten bleiben gespeichert, solange dein Konto besteht. Zertifikate und
          die zugehörigen Schulungsdaten bewahren wir darüber hinaus auf, weil sie den
          Nachweis über eine erteilte Qualifikation belegen. Löschst du dein Konto,
          werden Profil, Anmeldungen, Credits, Rückmeldungen und hochgeladene Nachweise
          entfernt; die Teilnehmerlisten der durchgeführten Schulungen bleiben als
          Kursdokumentation bestehen.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Anmeldung und Sitzung</div>
        <p style={TEXT}>
          Für die Anmeldung setzen wir ein technisch notwendiges Cookie, das deine
          Sitzung offen hält. Es ist für den Betrieb erforderlich und wird nicht zur
          Analyse verwendet. Weitergehende Analyse- oder Werbe-Cookies setzen wir
          nicht ein.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Deine Rechte</div>
        <p style={TEXT}>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch gegen Verarbeitungen, die
          auf einem berechtigten Interesse beruhen.
        </p>
        <p style={TEXT}>
          Zwei davon kannst du sofort selbst ausüben: Unter <strong>Einstellungen</strong>{" "}
          lädst du alle zu deinem Konto gespeicherten Daten herunter und löschst dort
          auch dein Konto.
        </p>
        <p style={TEXT}>
          Außerdem kannst du dich bei einer Aufsichtsbehörde beschweren. Zuständig ist
          der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <div style={TITEL}>Stand</div>
        <p style={TEXT}>August 2026</p>
      </section>
    </article>
  );
}
