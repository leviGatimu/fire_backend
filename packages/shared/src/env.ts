/**
 * Tiny typed env reader. Throws on missing required vars so a misconfigured
 * service fails fast at boot instead of at the first request.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function intEnv(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? Number.parseInt(v, 10) : fallback;
}
