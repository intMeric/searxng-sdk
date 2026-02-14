import { SearxngError } from "../errors/searxng-error.ts";

export interface FetchJsonOptions {
  timeout: number;
  headers: Record<string, string>;
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions,
): Promise<{ data: T; response: Response }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));

      if (response.status === 403) {
        throw new SearxngError(
          "JSON format not enabled on this instance",
          403,
        );
      }

      throw new SearxngError(
        `HTTP ${response.status} ${response.statusText}`,
        response.status,
        retryAfter,
      );
    }

    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      throw new SearxngError("Invalid JSON response", response.status);
    }

    return { data, response };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof SearxngError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new SearxngError("Request timed out", 0);
    }

    throw new SearxngError(
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
      0,
    );
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}
