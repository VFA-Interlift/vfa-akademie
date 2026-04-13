// src/app/api/trainings/public/route.ts
import { NextResponse } from "next/server";
import { MOCK_PUBLIC_TRAININGS } from "@/lib/trainings/mock";
import {
  PublicTraining,
  PublicTrainingsGroupedResponse,
  TrainingCategory,
} from "@/lib/trainings/types";

export const dynamic = "force-dynamic";

type ExtendedResponse = PublicTrainingsGroupedResponse & {
  availablePrefixes: string[];
  hideEmpty: boolean;
};

function groupByCategory(trainings: PublicTraining[]) {
  const order: TrainingCategory[] = ["VDI", "Elektrotechnik", "Schwerpunkte", "Praxis"];

  const map = new Map<TrainingCategory, PublicTraining[]>();
  for (const c of order) map.set(c, []);

  for (const t of trainings) {
    map.get(t.category)!.push(t);
  }

  return order.map((name) => ({
    name,
    trainings: (map.get(name) ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate)),
  }));
}

function collectPrefixes(trainings: PublicTraining[]): string[] {
  // heuristisch: alles vor der ersten "-" als Prefix nehmen und wieder "-" anhängen
  const set = new Set<string>();
  for (const t of trainings) {
    const idx = t.code.indexOf("-");
    if (idx > 0) set.add(t.code.slice(0, idx + 1).toUpperCase());
  }
  return Array.from(set).sort();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const prefixRaw = searchParams.get("prefix")?.trim() ?? "";
  const prefix = prefixRaw.length > 0 ? prefixRaw : undefined;

  const hideEmpty = (searchParams.get("hideEmpty") ?? "true").toLowerCase() !== "false";

  // nur öffentliche Trainings
  const allPublic = MOCK_PUBLIC_TRAININGS.filter((t) => t.isPublic);

  // optional Prefix-Filter
  let trainings = allPublic;
  if (prefix) {
    trainings = trainings.filter((t) => t.code.toUpperCase().startsWith(prefix.toUpperCase()));
  }

  let categories = groupByCategory(trainings);
  if (hideEmpty) {
    categories = categories.filter((c) => c.trainings.length > 0);
  }

  const response: ExtendedResponse = {
    ok: true,
    updatedAt: new Date().toISOString(),
    prefix,
    hideEmpty,
    availablePrefixes: collectPrefixes(allPublic),
    categories,
  };

  return NextResponse.json(response);
}
