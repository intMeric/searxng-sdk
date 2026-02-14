import { describe, expect, test } from "bun:test";
import { withRetry } from "../src/http/retry.ts";
import { SearxngError } from "../src/errors/searxng-error.ts";

describe("withRetry", () => {
  const fastOptions = { maxRetries: 2, baseDelayMs: 1 };

  test("should return result on first success", async () => {
    const result = await withRetry(() => Promise.resolve("ok"), fastOptions);
    expect(result).toBe("ok");
  });

  test("should retry on 429 and succeed", async () => {
    let attempts = 0;

    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new SearxngError("Too Many Requests", 429);
      }
      return "ok";
    }, fastOptions);

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  test("should throw after max retries on 429", async () => {
    let attempts = 0;

    try {
      await withRetry(async () => {
        attempts++;
        throw new SearxngError("Too Many Requests", 429);
      }, fastOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).status).toBe(429);
      expect(attempts).toBe(3); // 1 initial + 2 retries
    }
  });

  test("should NOT retry on non-429 errors", async () => {
    let attempts = 0;

    try {
      await withRetry(async () => {
        attempts++;
        throw new SearxngError("Server Error", 500);
      }, fastOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).status).toBe(500);
      expect(attempts).toBe(1);
    }
  });

  test("should NOT retry on non-SearxngError", async () => {
    let attempts = 0;

    try {
      await withRetry(async () => {
        attempts++;
        throw new Error("random error");
      }, fastOptions);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("random error");
      expect(attempts).toBe(1);
    }
  });

  test("should respect Retry-After header (uses max of backoff and retryAfter)", async () => {
    let attempts = 0;
    const start = Date.now();

    try {
      await withRetry(
        async () => {
          attempts++;
          throw new SearxngError("Too Many Requests", 429, 0.01); // 10ms
        },
        { maxRetries: 1, baseDelayMs: 1 },
      );
    } catch {
      // expected
    }

    const elapsed = Date.now() - start;
    expect(attempts).toBe(2);
    // Should have waited at least max(baseDelayMs=1, retryAfter*1000=10) = 10ms
    expect(elapsed).toBeGreaterThanOrEqual(9);
  });

  test("should work with maxRetries=0 (no retries)", async () => {
    let attempts = 0;

    try {
      await withRetry(
        async () => {
          attempts++;
          throw new SearxngError("Too Many Requests", 429);
        },
        { maxRetries: 0, baseDelayMs: 1 },
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect(attempts).toBe(1);
    }
  });
});
