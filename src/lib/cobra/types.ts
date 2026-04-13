// src/lib/cobra/types.ts

export type CobraTokenResponse = {
  success: boolean;
  token?: string;
  errorMessage?: string;
};

export type CobraQueryParams = Record<string, string | number | boolean | undefined>;

export class CobraError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, opts?: { status?: number; details?: unknown }) {
    super(message);
    this.name = "CobraError";
    this.status = opts?.status;
    this.details = opts?.details;
  }
}
