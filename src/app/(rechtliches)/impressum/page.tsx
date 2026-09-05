import type { Metadata } from "next";
import { RechtlichesKopf } from "../Rueckweg";
import { ABSCHNITT, LINK, TEXT, TITEL, UNTERTITEL } from "../stil";

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
 *
 * Kopf und Stile seit der Launch-Runde (05.09.2026): Titel im Petrol-Band,
 * Abschnittstitel als .etikett, Farben nur über Token.
 */
export default function ImpressumPage() {
  return (
    <article>
      <RechtlichesKopf title="Impressum" />
      <p style={UNTERTITEL}>Angaben gemäß § 5 DDG</p>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Anbieterin</h2>
        <p style={TEXT}>
          VFA-Akademie gGmbH
          <br />
          Süderstraße 282
          <br />
          20537 Hamburg
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Vertreten durch</h2>
        <p style={TEXT}>Geschäftsführer: Andreas Hönnige</p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Kontakt</h2>
        <p style={TEXT}>
          Telefon: +49 40 8000473-0
          <br />
          E-Mail:{" "}
          <a href="mailto:info@vfa-interlift.de" style={LINK}>
            info@vfa-interlift.de
          </a>
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Registereintrag</h2>
        <p style={TEXT}>
          Handelsregister: HRB 155315
          <br />
          Registergericht: Amtsgericht Hamburg
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Umsatzsteuer-Identifikationsnummer</h2>
        <p style={TEXT}>DE220846803</p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Verbraucherstreitbeilegung</h2>
        <p style={TEXT}>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section style={ABSCHNITT}>
        <h2 className="etikett" style={TITEL}>Haftung für Inhalte</h2>
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
        <h2 className="etikett" style={TITEL}>Urheberrecht</h2>
        <p style={TEXT}>
          Die durch uns erstellten Inhalte und Werke in dieser Anwendung unterliegen
          dem deutschen Urheberrecht. Ausgestellte Teilnahmebestätigungen und
          Zertifikate sind ausschließlich für die darin genannte Person bestimmt.
        </p>
      </section>
    </article>
  );
}
