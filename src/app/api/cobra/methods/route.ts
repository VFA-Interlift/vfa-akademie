// src/app/api/cobra/methods/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function getToken() {
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
  if (!res.ok) return { ok: false, status: res.status, body: text, token: "" };

  try {
    const j = JSON.parse(text);
    return { ok: true, status: res.status, body: text, token: j?.token ?? "" };
  } catch {
    return { ok: false, status: 500, body: text, token: "" };
  }
}

async function hit(url: string, method: string, headers: Record<string, string>, body?: any) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();

  const headersObj: Record<string, string> = {};
  res.headers.forEach((v, k) => (headersObj[k] = v));

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

  const endpoint = new URL(req.url).searchParams.get("endpoint") ?? "Teilnehmermanagement";
  const url = `${base}/api/${endpoint}`;

  const tokenInfo = await getToken();
  const token = tokenInfo.token;

  const authHeaders: Record<string, string> = token
    ? { ApiKey: apiKey, Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { ApiKey: apiKey, Accept: "application/json" };

  // OPTIONS zeigt oft "Allow" Header
  const optionsRes = await hit(url, "OPTIONS", authHeaders);

  // Wir testen außerdem HEAD und POST (POST ohne Payload) – POST kann 400 geben, aber zeigt oft, dass es erlaubt ist
  const headRes = await hit(url, "HEAD", authHeaders);

  const postRes = await hit(
    url,
    "POST",
    { ...authHeaders, "Content-Type": "application/json" },
    {} // leere payload; sollte NICHTS schreiben, aber kann 400 zurückgeben
  );

  return NextResponse.json({
    endpoint,
    tokenCall: { ok: tokenInfo.ok, status: tokenInfo.status },
    results: [optionsRes, headRes, postRes],
    note:
      "Wichtig: POST wurde mit leerem JSON getestet. Falls das bei euch Side-Effects hätte, sag Bescheid, dann entferne ich POST-Test sofort.",
  });
}
