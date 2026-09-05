import type { Metadata } from "next";
import { RechtlichesKopf } from "../Rueckweg";
import { ABSCHNITT, LINK, LISTE, TEXT, TITEL, UNTERTITEL } from "../stil";

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
 *
 * Launch-Runde 05.09.2026: Push-Mitteilungen ergänzt (PushAbo je Gerät,
 * Zustellung über den Push-Dienst des Geräteherstellers), Aufbewahrung an die
 * tatsächliche Kontolöschung angeglichen (Zertifikate hängen per Cascade am
 * Konto, siehe api/me/delete), Kopf und Stile wie überall.
 */
export default function DatenschutzPage() {
  return (
    <article>
      <RechtlichesKopf title="Datenschutz" />
      <p style={UNTERTITEL}>
        Information nach Art. 13 und 14 DSGVO für die App der VFA-Akademie
      </p>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Verantwortliche</h2>
        <p style={TEXT}>
          VFA-Akademie gGmbH, Süderstraße 282, 20537 Hamburg
          <br />
          Telefon +49 40 8000473-0, E-Mail{" "}
          <a href="mailto:info@vfa-interlift.de" style={LINK}>
            info@vfa-interlift.de
          </a>
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Welche Daten wir verarbeiten</h2>
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
          <li>bei eingeschalteten Push-Mitteilungen: ein Abo je Gerät (Adresse beim Push-Dienst und zwei technische Schlüssel)</li>
        </ul>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Woher die Daten stammen</h2>
        <p style={TEXT}>
          Neben deinen eigenen Eingaben erhalten wir Anmeldedaten aus dem
          Anmeldeformular auf vfa-interlift.de und aus der Verbandsverwaltung. Stimmt
          die dort hinterlegte E-Mail-Adresse mit deinem Konto überein, erscheinen die
          zugehörigen Schulungen automatisch in der App.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Wozu und auf welcher Grundlage</h2>
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
            <strong>Erinnerungen vor einer Schulung</strong> per E-Mail oder
            Push-Mitteilung — Art. 6 Abs. 1 lit. f DSGVO. Du kannst sie jederzeit
            unter Einstellungen abschalten.
          </li>
          <li>
            <strong>Rückmeldungen zu Schulungen und Credits</strong> — Art. 6 Abs. 1
            lit. f DSGVO (Qualitätssicherung). Die Abgabe ist freiwillig.
          </li>
        </ul>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Push-Mitteilungen</h2>
        <p style={TEXT}>
          Push-Mitteilungen sind standardmäßig aus. Schaltest du sie unter
          Einstellungen ein, speichern wir für dieses Gerät ein Abo: die Adresse, die
          der Push-Dienst dem Gerät zuweist, und zwei Schlüssel, mit denen die
          Nachricht verschlüsselt wird. Die Zustellung läuft über den Push-Dienst des
          Geräteherstellers (zum Beispiel Apple bei iPhone und iPad, Google bei Android). Dieser
          Dienst sieht, dass eine Nachricht an das Gerät geht, nicht ihren Inhalt.
          Du kannst die Mitteilungen jederzeit unter Einstellungen abschalten; das Abo
          dieses Geräts wird dann gelöscht.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Ranking</h2>
        <p style={TEXT}>
          Das Ranking zeigt ausschließlich anonyme Werte: den ersten Platz ohne Namen,
          deine eigene Platzierung und den Median aller Teilnehmenden (den mittleren
          Wert, nicht den Durchschnitt). Andere Personen sind dort nicht erkennbar.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Wer die Daten sonst noch sieht</h2>
        <ul style={LISTE}>
          <li>
            <strong>Dozentinnen und Dozenten</strong> sehen die Teilnehmenden ihrer
            eigenen Schulung und tragen dort die Anwesenheit ein. Unterschriebene
            Anwesenheitslisten laden sie als Scan hoch; die Datei gehört zur
            Schulungsdokumentation. Rückmeldungen sehen sie nur zusammengefasst.
          </li>
          <li>
            <strong>Die Geschäftsstelle</strong> verwaltet Konten, Schulungen und
            Zertifikate.
          </li>
          <li>
            <strong>Technische Dienstleister</strong> im Auftrag: der Betreiber der
            Anwendung samt Datenbank und Dateispeicher sowie der Versanddienst für
            E-Mails. Beide verarbeiten die Daten weisungsgebunden in unserem Auftrag.
            Push-Mitteilungen stellt zusätzlich der Push-Dienst des Geräteherstellers
            zu (siehe oben).
          </li>
        </ul>
        <p style={TEXT}>Eine Weitergabe zu Werbezwecken findet nicht statt.</p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Wie lange wir speichern</h2>
        <p style={TEXT}>
          Kontodaten bleiben gespeichert, solange dein Konto besteht. Löschst du dein
          Konto, werden Profil, Anmeldungen, Zertifikate, Credits, Rückmeldungen,
          Push-Abos und hochgeladene Nachweise entfernt. Die Teilnehmerlisten der
          durchgeführten Schulungen aus Anmeldeformular und Verbandsverwaltung bleiben
          als Schulungsdokumentation bestehen; sie gehören nicht zum App-Konto.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Anmeldung und Sitzung</h2>
        <p style={TEXT}>
          Für die Anmeldung setzen wir ein technisch notwendiges Cookie, das deine
          Sitzung offen hält. Es ist für den Betrieb erforderlich und wird nicht zur
          Analyse verwendet. Weitergehende Analyse- oder Werbe-Cookies setzen wir
          nicht ein.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Deine Rechte</h2>
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
        <h2 className="etikett" style={TITEL}>Stand</h2>
        <p style={TEXT}>September 2026</p>
      </section>
    </article>
  );
}
