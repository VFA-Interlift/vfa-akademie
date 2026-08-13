import BackButton from "@/components/BackButton";

type PageHeaderProps = {
  title: string;
  description?: string;
  backLabel?: string;
  showBackButton?: boolean;
  showTitle?: boolean;
};

export default function PageHeader({
  title,
  backLabel = "Zurück",
  // Untere Menüleiste (BottomNav) + Browser-Zurück decken die Navigation ab,
  // daher standardmäßig kein redundanter Zurück-Button mehr oben.
  showBackButton = false,
  showTitle = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  description: _description,
}: PageHeaderProps) {
  // Der Seitenkopf aller Seiten außer dem Dashboard: ein kompaktes
  // Petrol-Band mit den feinen diagonalen Streifen und dem gelben Schein der
  // Marke, nur bis zur Überschrift (Tobis Wunsch vom 13.08.2026). Auf dem
  // Handy läuft es in voller Breite bis unter die Statusleiste — der
  // Deckstreifen SafeTop entfällt auf diesen Seiten, das Band selbst gibt der
  // Uhr den Grund. Gestaltung in globals.css unter .seiten-kopf.
  return (
    <div className="seiten-kopf">
      {showBackButton && (
        <div style={{ marginBottom: 14 }}>
          <BackButton label={backLabel} />
        </div>
      )}
      {showTitle && (
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(22px, 5vw, 28px)",
            fontWeight: 800,
            // Fest weiß: Das Band ist in beiden Modi Petrol.
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}
