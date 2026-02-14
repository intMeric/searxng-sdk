import { describe, expect, test } from "bun:test";
import { SearxngClient } from "../src/client.ts";
import { SearchBuilder } from "../src/builders/search.builder.ts";
import { SearxngError } from "../src/errors/searxng-error.ts";

describe("SearxngClient", () => {
  test("should create client with minimal config", () => {
    const client = new SearxngClient({ baseUrl: "http://localhost:8888" });
    expect(client).toBeDefined();
  });

  test("should strip trailing slashes from baseUrl", () => {
    const client = new SearxngClient({ baseUrl: "http://localhost:8888///" });
    const builder = client.search("test");
    expect(builder).toBeInstanceOf(SearchBuilder);
  });

  test("should throw on empty baseUrl", () => {
    expect(() => new SearxngClient({ baseUrl: "" })).toThrow(SearxngError);
  });

  test("should throw on whitespace-only baseUrl", () => {
    expect(() => new SearxngClient({ baseUrl: "   " })).toThrow(SearxngError);
  });

  test("should throw on timeout <= 0", () => {
    expect(
      () => new SearxngClient({ baseUrl: "http://localhost", timeout: 0 }),
    ).toThrow(SearxngError);
    expect(
      () => new SearxngClient({ baseUrl: "http://localhost", timeout: -1 }),
    ).toThrow(SearxngError);
  });

  test("should throw on negative maxRetries", () => {
    expect(
      () =>
        new SearxngClient({
          baseUrl: "http://localhost",
          retry: { maxRetries: -1 },
        }),
    ).toThrow(SearxngError);
  });

  test("should accept maxRetries = 0 (no retries)", () => {
    const client = new SearxngClient({
      baseUrl: "http://localhost",
      retry: { maxRetries: 0 },
    });
    expect(client).toBeDefined();
  });

  test("should return SearchBuilder from search()", () => {
    const client = new SearxngClient({ baseUrl: "http://localhost:8888" });
    const builder = client.search("bitcoin");
    expect(builder).toBeInstanceOf(SearchBuilder);
  });
});
