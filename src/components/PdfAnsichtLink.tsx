import type { CSSProperties, ReactNode } from "react";
import AppButton from "@/components/ui/AppButton";

type KnopfVariante = NonNullable<React.ComponentProps<typeof AppButton>["variant"]>;

/**
 * Link auf ein PDF, der es in der Leseansicht des Geräts öffnet.
 *
 * Tobis Ansage vom 05.09.2026: Zertifikate und PDFs sollen direkt in der
 * Ansicht aufgehen, die das Gerät dafür mitbringt — mit Blättern, Zoom, Teilen
 * und Sichern. Deshalb ist das hier ein ganz gewöhnlicher Link in einen neuen
 * Tab; alles Weitere macht der Browser selbst.
 *
 * Vorher (12.08.2026) holte die App die Datei per fetch, machte daraus eine
 * Blob-Adresse und zeigte sie in einem eigenen Vollbild mit eingebettetem
 * Rahmen und X zum Schließen. Der Grund damals war, dass es aus einem fremden
 * Viewer keinen Weg zurück in die App gebe. Der Rahmen zeigte auf dem iPhone
 * aber nur die starre erste Seite, weshalb am 20.08. schon ein Knopf „Öffnen"
 * danebenstand, der genau das tat, was jetzt gleich passiert. Zurück kommt man
 * über die Zurück-Geste bzw. „Fertig" des Systems.
 *
 * Mit `knopf` wird statt des nackten Textlinks ein AppButton der genannten
 * Variante gezeigt — so bleibt der Ansehen-Knopf bei den eigenen Nachweisen im
 * Baukasten, ohne die Pille nachzubauen.
 */
export default function PdfAnsichtLink({
  url,
  titel,
  style,
  knopf,
  children,
}: {
  url: string;
  /** Beschriftung für Screenreader, wenn der Linktext allein zu knapp ist. */
  titel: string;
  style?: CSSProperties;
  knopf?: KnopfVariante;
  children: ReactNode;
}) {
  if (knopf) {
    return (
      <AppButton href={url} external variant={knopf} ariaLabel={titel}>
        {children}
      </AppButton>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={titel}
      style={{ cursor: "pointer", textDecoration: "none", ...style }}
    >
      {children}
    </a>
  );
}
