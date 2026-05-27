import { NextResponse } from "next/server";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";

export const dynamic = "force-dynamic";

type CobraHealthSample = unknown;

function getEnv(name: string) {
  return process.env[name] ?? null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET() {
  const endpointName = getEnv("COBRA_HEALTH_ENDPOINT");

  if (!endpointName) {
    return NextResponse.json(
      {
        ok: false,
        message: "COBRA_HEALTH_ENDPOINT is not configured",
      },
      { status: 503 }
    );
  }

  try {
    const data = await cobraEndpointGet<CobraHealthSample>(endpointName, {
      Top: 1,
    });

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
        details: getErrorMessage(err),
      },
      { status: 500 }
    );
  }
}