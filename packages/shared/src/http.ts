/**
 * Minimal typed wrapper around fetch for synchronous service-to-service calls
 * (e.g. inspection-service asking notification-service to send a message).
 * Keeps a short timeout so a slow dependency cannot hang the caller.
 */
export async function serviceFetch<T = unknown>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 5000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(rest.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(`serviceFetch ${url} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
