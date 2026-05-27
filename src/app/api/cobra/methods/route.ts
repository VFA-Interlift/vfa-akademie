// src/app/api/cobra/methods/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TokenInfo = {
  ok: boolean;
  status: number;
  body: string;
  token: string;
};

type ProbeBody = Record<string, unknown>;

function mustEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

async function getToken(): Promise<TokenInfo> {
  const base = mustEnv("COBRA_BASE_URL").replace(/\/+$/, "");
  const apiKey = mustEnv("COBRA_API_KEY");
  const userName = mustEnv("COBRA_USERNAME");
  const password = mustEnv("COBRA_PASSWORD");

  const res = await fetch(`${base}/api/token`, {
    method: "POST",
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName, password }),
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      body: text,
      token: "",
    };
  }

  try {
    const parsed = JSON.parse(text) as { token?: unknown };

    return {
      ok: true,
      status: res.status,
      body: text,
      token: typeof parsed.token === "string" ? parsed.token : "",
    };
  } catch {
    return {
      ok: false,
      status: 500,
      body: text,
      token: "",
    };
  }
}

async function hit(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: ProbeBody
) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();

  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return {
    method,
    url,
    status: res.status,
    ok: res.ok,
    statusText: res.statusText,
    headers: headersObj,
    body: text.slice(0, 2000),
  };
}

export async function GET(req: Request) {
  const base = mustEnv("COBRA_BASE_URL").replace(/\/+$/, "");
  const apiKey = mustEnv("COBRA_API_KEY");

  const endpoint =
    new URL(req.url).searchParams.get("endpoint") ?? "Teilnehmermanagement";
  const url = `${base}/api/${endpoint}`;

  const tokenInfo = await getToken();
  const token = tokenInfo.token;

  const authHeaders: Record<string, string> = token
    ? {
        ApiKey: apiKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      }
    : {
        ApiKey: apiKey,
        Accept: "application/json",
      };

  const optionsRes = await hit(url, "OPTIONS", authHeaders);
  const headRes = await hit(url, "HEAD", authHeaders);

  const postRes = await hit(
    url,
    "POST",
    {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    {}
  );

  return NextResponse.json({
    endpoint,
    tokenCall: {
      ok: tokenInfo.ok,
      status: tokenInfo.status,
    },
    results: [optionsRes, headRes, postRes],
    note:
      "POST wurde mit leerem JSON getestet. Falls dieser Test nicht mehr benötigt wird, sollte er entfernt werden.",
  });
}