import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { fetchJson } from "../src/http/fetch.ts";
import { SearxngError } from "../src/errors/searxng-error.ts";

describe("fetchJson", () => {
  let originalFetch: typeof globalThis.fetch;

  const defaultOptions = { timeout: 5000, headers: {} };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("should return parsed JSON on success", async () => {
    const payload = { query: "test", results: [] };

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => payload,
      }),
    ) as any;

    const { data } = await fetchJson("http://localhost/search", defaultOptions);
    expect(data).toEqual(payload);
  });

  test("should pass Accept header and custom headers", async () => {
    const mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => ({}),
      }),
    ) as any;

    globalThis.fetch = mockFetch;

    await fetchJson("http://localhost/search", {
      timeout: 5000,
      headers: { Authorization: "Basic abc" },
    });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost/search", {
      signal: expect.any(AbortSignal),
      headers: {
        Accept: "application/json",
        Authorization: "Basic abc",
      },
    });
  });

  test("should throw SearxngError with status on HTTP error", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers(),
      }),
    ) as any;

    try {
      await fetchJson("http://localhost/search", defaultOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).status).toBe(500);
      expect((error as SearxngError).message).toContain("500");
    }
  });

  test("should throw specific message on 403", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: new Headers(),
      }),
    ) as any;

    try {
      await fetchJson("http://localhost/search", defaultOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).status).toBe(403);
      expect((error as SearxngError).message).toBe(
        "JSON format not enabled on this instance",
      );
    }
  });

  test("should parse Retry-After header on 429", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: new Headers({ "Retry-After": "60" }),
      }),
    ) as any;

    try {
      await fetchJson("http://localhost/search", defaultOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).status).toBe(429);
      expect((error as SearxngError).retryAfter).toBe(60);
    }
  });

  test("should throw on invalid JSON", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    ) as any;

    try {
      await fetchJson("http://localhost/search", defaultOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).message).toBe("Invalid JSON response");
    }
  });

  test("should throw on timeout", async () => {
    globalThis.fetch = mock(
      (_url: string, options?: any) =>
        new Promise((_resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              const error = new Error("The operation was aborted");
              error.name = "AbortError";
              reject(error);
            });
          }
        }),
    ) as any;

    try {
      await fetchJson("http://localhost/search", { timeout: 10, headers: {} });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).message).toBe("Request timed out");
      expect((error as SearxngError).status).toBe(0);
    }
  });

  test("should throw on network error", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Connection refused")),
    ) as any;

    try {
      await fetchJson("http://localhost/search", defaultOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).message).toContain("Network error");
      expect((error as SearxngError).message).toContain("Connection refused");
      expect((error as SearxngError).status).toBe(0);
    }
  });
});
