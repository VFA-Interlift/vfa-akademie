import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 10 }}>
          <Link href="/admin" style={{ color: "#007873", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            ← Adminbereich
          </Link>
        </div>

        <PageHeader backHref="/admin" backLabel="Adminbereich" title="Historie importieren"
          description="Einmaliger Import vergangener Schulungen und Teilnehmer aus zwei Cobra-Exporten. Ein erneuter Lauf legt nichts doppelt an, sondern aktualisiert die vorhandenen Datensätze."
        />

        <ImportClient />
      </div>
    </main>
  );
}
