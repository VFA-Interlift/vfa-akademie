// src/app/api/cobra/health/route.ts
import { NextResponse } from "next/server";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";

export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function GET() {
  try {
    const endpointName = mustEnv("COBRA_HEALTH_ENDPOINT");
    const data = await cobraEndpointGet<any>(endpointName, { Top: 1 });

    return NextResponse.json({
      ok: true,
      endpoint: endpointName,
      sample: data,
    });
  } catch (err: unknown) {
    if (err instanceof CobraError) {
      return NextResponse.json(
        {
          ok: false,
          message: err.message,
          status: err.status ?? 500,
          details: err.details,
        },
        { status: err.status ?? 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Unknown error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
