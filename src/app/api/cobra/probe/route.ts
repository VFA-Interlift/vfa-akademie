// src/app/api/cobra/probe/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function hit(url: string, opts?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...opts });
  const text = await res.text();

  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k] = v));

  return {
    url,
    status: res.status,
    ok: res.ok,
    statusText: res.statusText,
    headers,
    body: text.slice(0, 2000) // begrenzen
  };
}

export async function GET() {
  const base = mustEnv("COBRA_BASE_URL").replace(/\/+$/, "");
  const apiKey = mustEnv("COBRA_API_KEY");
  const userName = mustEnv("COBRA_USERNAME");
  const password = mustEnv("COBRA_PASSWORD");

  // 1) Token holen
  const tokenRes = await fetch(`${base}/api/token`, {
    method: "POST",
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName, password }),
    cache: "no-store",
  });

  const tokenText = await tokenRes.text();
  let token = "";
  try {
    const parsed = JSON.parse(tokenText);
    token = parsed?.token ?? "";
  } catch {}

  // 2) Kandidaten testen (häufige Pfade)
  const candidates = [
    `${base}/api`,
    `${base}/api/`,
    `${base}/api/Schulungen`,
    `${base}/api/schulungen`,
    `${base}/webconnect/api/Schulungen`,
    `${base}/WebConnect/api/Schulungen`,
    `${base}/api/v1/Schulungen`,
  ];

  const checks = [];
  for (const url of candidates) {
    checks.push(
      await hit(url, {
        method: "GET",
        headers: token
          ? { ApiKey: apiKey, Authorization: `Bearer ${token}`, Accept: "application/json" }
          : { ApiKey: apiKey, Accept: "application/json" },
      })
    );
  }

  return NextResponse.json({
    base,
    tokenCall: {
      status: tokenRes.status,
      ok: tokenRes.ok,
      body: tokenText.slice(0, 2000),
    },
    tokenPresent: Boolean(token),
    checks,
  });
}
