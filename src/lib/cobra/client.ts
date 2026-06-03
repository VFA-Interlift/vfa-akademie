// src/lib/cobra/client.ts
import "server-only";
import { CobraError, CobraQueryParams, CobraTokenResponse } from "./types";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new CobraError(`Missing env var: ${name}`);
  }

  return value;
}

function getEnvAny(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  throw new CobraError(`Missing env var: ${names.join(" or ")}`);
}

function getCobraConfig() {
  return {
    baseUrl: getEnv("COBRA_BASE_URL").replace(/\/+$/, ""),
    apiKey: getEnv("COBRA_API_KEY"),
    username: getEnvAny(["COBRA_USERNAME", "COBRA_USER"]),
    password: getEnvAny(["COBRA_PASSWORD", "COBRA_PASS"]),
  };
}

let cachedToken: { token: string; expEpochSeconds: number } | null = null;

function readJwtExp(token: string): number {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return Math.floor(Date.now() / 1000) + 60;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const json = Buffer.from(padded, "base64").toString("utf8");
    const data = JSON.parse(json) as { exp?: number };

    if (typeof data.exp === "number") {
      return data.exp;
    }

    return Math.floor(Date.now() / 1000) + 60;
  } catch {
    return Math.floor(Date.now() / 1000) + 60;
  }
}

async function fetchToken(): Promise<{ token: string; expEpochSeconds: number }> {
  const { baseUrl, apiKey, username, password } = getCobraConfig();
  const url = `${baseUrl}/api/token`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userName: username,
      password,
    }),
    cache: "no-store",
  });

  const text = await res.text();

  let data: CobraTokenResponse | null = null;

  try {
    data = JSON.parse(text) as CobraTokenResponse;
  } catch {
    // handled below
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

  return {
    token: data.token,
    expEpochSeconds: readJwtExp(data.token),
  };
}

async function getValidToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expEpochSeconds - 60 > now) {
    return cachedToken.token;
  }

  cachedToken = await fetchToken();

  return cachedToken.token;
}

function buildUrl(path: string, params?: CobraQueryParams): string {
  const { baseUrl } = getCobraConfig();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function cobraRequest<T>(
  path: string,
  opts?: {
    method?: "GET";
    params?: CobraQueryParams;
  }
): Promise<T> {
  const { apiKey } = getCobraConfig();
  const method = opts?.method ?? "GET";
  const token = await getValidToken();
  const url = buildUrl(path, opts?.params);

  const res = await fetch(url, {
    method,
    headers: {
      ApiKey: apiKey,
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
  return cobraRequest<T>(`/api/${endpointName}`, {
    method: "GET",
    params,
  });
}