import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import {
  importiereHistorie,
  leseSchulungen,
  leseTeilnehmer,
} from "@/lib/import/cobra-historie";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Einmaliger Import der Schulungshistorie aus zwei Cobra-Exporten.
 * `modus=vorschau` liest und rechnet nur, `modus=import` schreibt.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_FORM" }, { status: 400 });
  }

  const schulungsdatei = form.get("schulungen");
  const teilnehmerdatei = form.get("teilnehmer");
  const schreiben = String(form.get("modus") ?? "vorschau") === "import";

  if (!(schulungsdatei instanceof File) || !(teilnehmerdatei instanceof File)) {
    return NextResponse.json({ ok: false, error: "BEIDE_DATEIEN_NOETIG" }, { status: 400 });
  }

  try {
    const { schulungen, ohneDatum } = await leseSchulungen(await schulungsdatei.arrayBuffer());
    const teilnehmer = await leseTeilnehmer(await teilnehmerdatei.arrayBuffer());

    if (schulungen.length === 0) {
      return NextResponse.json(
        { ok: false, error: "KEINE_SCHULUNGEN_ERKANNT" },
        { status: 400 }
      );
    }
    if (teilnehmer.length === 0) {
      return NextResponse.json(
        { ok: false, error: "KEINE_TEILNEHMER_ERKANNT" },
        { status: 400 }
      );
    }

    const bericht = await importiereHistorie(schulungen, teilnehmer, { schreiben });
    bericht.schulungen.ohneDatum = ohneDatum;

    return NextResponse.json({ ok: true, geschrieben: schreiben, bericht });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "IMPORT_FEHLGESCHLAGEN",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
