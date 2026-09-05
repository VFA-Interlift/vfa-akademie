import PageHeader from "@/components/ui/PageHeader";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader backHref="/admin" backLabel="Adminbereich" title="Historie importieren" />
        {/* PageHeader zeigt keine Beschreibung — der Satz steht deshalb als Absatz unter dem Band. */}
        <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
          Einmaliger Import vergangener Schulungen und Teilnehmer aus zwei Cobra-Exporten. Ein
          erneuter Lauf legt nichts doppelt an, sondern aktualisiert die vorhandenen Datensätze.
        </p>

        <ImportClient />
      </div>
    </main>
  );
}
