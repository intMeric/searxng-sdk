import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { SearchBuilder } from "../src/builders/search.builder.ts";
import { SearxngError } from "../src/errors/searxng-error.ts";
import type { ResolvedConfig } from "../src/types/config.ts";

const baseConfig: ResolvedConfig = {
  baseUrl: "http://localhost:8888",
  timeout: 5000,
  retry: { maxRetries: 0, baseDelayMs: 1 },
  headers: {},
};

describe("SearchBuilder", () => {
  test("should throw on empty query", () => {
    expect(() => new SearchBuilder("", baseConfig)).toThrow(SearxngError);
    expect(() => new SearchBuilder("   ", baseConfig)).toThrow(SearxngError);
  });

  test("should throw on page < 1", () => {
    const builder = new SearchBuilder("test", baseConfig);
    expect(() => builder.page(0)).toThrow(SearxngError);
    expect(() => builder.page(-1)).toThrow(SearxngError);
  });

  test("should be chainable", () => {
    const builder = new SearchBuilder("test", baseConfig);
    const result = builder
      .categories("news", "general")
      .engines("google", "bing")
      .language("fr")
      .page(2)
      .timeRange("week")
      .safesearch(1);

    expect(result).toBe(builder);
  });

  test("should throw when executed twice", async () => {
    let originalFetch = globalThis.fetch;

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ query: "test", results: [] }),
      }),
    ) as any;

    const builder = new SearchBuilder("test", baseConfig);
    await builder.execute();

    try {
      await builder.execute();
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(SearxngError);
      expect((error as SearxngError).message).toContain("already executed");
    }

    globalThis.fetch = originalFetch;
  });

  describe("URL building", () => {
    let originalFetch: typeof globalThis.fetch;
    let capturedUrl: string;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      capturedUrl = "";

      globalThis.fetch = mock((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ query: "test", results: [] }),
        });
      }) as any;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    test("should build basic URL with query and format", async () => {
      await new SearchBuilder("bitcoin", baseConfig).execute();

      const url = new URL(capturedUrl);
      expect(url.origin).toBe("http://localhost:8888");
      expect(url.pathname).toBe("/search");
      expect(url.searchParams.get("q")).toBe("bitcoin");
      expect(url.searchParams.get("format")).toBe("json");
    });

    test("should include categories as comma-separated", async () => {
      await new SearchBuilder("test", baseConfig)
        .categories("news", "general")
        .execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("categories")).toBe("news,general");
    });

    test("should include engines as comma-separated", async () => {
      await new SearchBuilder("test", baseConfig)
        .engines("google", "bing")
        .execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("engines")).toBe("google,bing");
    });

    test("should include language", async () => {
      await new SearchBuilder("test", baseConfig).language("fr").execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("language")).toBe("fr");
    });

    test("should include page number", async () => {
      await new SearchBuilder("test", baseConfig).page(3).execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("pageno")).toBe("3");
    });

    test("should include time range", async () => {
      await new SearchBuilder("test", baseConfig).timeRange("week").execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("time_range")).toBe("week");
    });

    test("should include safesearch", async () => {
      await new SearchBuilder("test", baseConfig).safesearch(2).execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("safesearch")).toBe("2");
    });

    test("should apply default language from config", async () => {
      const config: ResolvedConfig = {
        ...baseConfig,
        defaultLanguage: "en",
      };
      await new SearchBuilder("test", config).execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("language")).toBe("en");
    });

    test("should override default language with builder", async () => {
      const config: ResolvedConfig = {
        ...baseConfig,
        defaultLanguage: "en",
      };
      await new SearchBuilder("test", config).language("fr").execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("language")).toBe("fr");
    });

    test("should apply default categories from config", async () => {
      const config: ResolvedConfig = {
        ...baseConfig,
        defaultCategories: ["news", "general"],
      };
      await new SearchBuilder("test", config).execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.get("categories")).toBe("news,general");
    });

    test("should not include undefined params", async () => {
      await new SearchBuilder("test", baseConfig).execute();

      const url = new URL(capturedUrl);
      expect(url.searchParams.has("categories")).toBe(false);
      expect(url.searchParams.has("engines")).toBe(false);
      expect(url.searchParams.has("pageno")).toBe(false);
      expect(url.searchParams.has("time_range")).toBe(false);
      expect(url.searchParams.has("safesearch")).toBe(false);
    });
  });
});
