// src/lib/cobra/client.ts
import "server-only";
import { CobraError, CobraQueryParams, CobraTokenResponse } from "./types";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new CobraError(`Missing env var: ${name}`);
  return v;
}

const COBRA_BASE_URL = getEnv("COBRA_BASE_URL").replace(/\/+$/, "");
const COBRA_API_KEY = getEnv("COBRA_API_KEY");
const COBRA_USERNAME = getEnv("COBRA_USERNAME");
const COBRA_PASSWORD = getEnv("COBRA_PASSWORD");

let cachedToken: { token: string; expEpochSeconds: number } | null = null;

function readJwtExp(token: string): number {
  try {
    const [, payload] = token.split(".");
    if (!payload) return Math.floor(Date.now() / 1000) + 60;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const json = Buffer.from(padded, "base64").toString("utf8");
    const data = JSON.parse(json) as { exp?: number };

    if (typeof data.exp === "number") return data.exp;
    return Math.floor(Date.now() / 1000) + 60;
  } catch {
    return Math.floor(Date.now() / 1000) + 60;
  }
}

async function fetchToken(): Promise<{ token: string; expEpochSeconds: number }> {
  const url = `${COBRA_BASE_URL}/api/token`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ApiKey: COBRA_API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userName: COBRA_USERNAME,
      password: COBRA_PASSWORD,
    }),
    cache: "no-store",
  });

  const text = await res.text();

  let data: CobraTokenResponse | null = null;
  try {
    data = JSON.parse(text) as CobraTokenResponse;
  } catch {
    // ignore - handled below
  }

  if (!res.ok) {
    throw new CobraError(`Cobra token request failed (${res.status})`, {
      status: res.status,
      details: data ?? text,
    });
  }

  if (!data?.success || !data.token) {
    throw new CobraError("Cobra token response was not successful", {
      details: data ?? text,
    });
  }

  return { token: data.token, expEpochSeconds: readJwtExp(data.token) };
}

async function getValidToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expEpochSeconds - 60 > now) return cachedToken.token;

  cachedToken = await fetchToken();
  return cachedToken.token;
}

function buildUrl(path: string, params?: CobraQueryParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${COBRA_BASE_URL}${cleanPath}`);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function cobraRequest<T>(
  path: string,
  opts?: { method?: "GET"; params?: CobraQueryParams }
): Promise<T> {
  const method = opts?.method ?? "GET";
  const token = await getValidToken();
  const url = buildUrl(path, opts?.params);

  const res = await fetch(url, {
    method,
    headers: {
      ApiKey: COBRA_API_KEY,
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new CobraError(`Cobra request failed (${res.status}) ${method} ${path}`, {
      status: res.status,
      details: bodyText,
    });
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new CobraError(`Cobra response was not valid JSON for ${method} ${path}`, {
      details: bodyText,
    });
  }
}

export async function cobraEndpointGet<T>(
  endpointName: string,
  params?: CobraQueryParams
): Promise<T> {
  return cobraRequest<T>(`/api/${endpointName}`, { method: "GET", params });
}
