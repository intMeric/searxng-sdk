import { describe, expect, test } from "bun:test";
import { mapRawResponse } from "../src/builders/response-mapper.ts";

describe("mapRawResponse", () => {
  test("should map a full realistic SearXNG response", () => {
    const raw = {
      query: "bitcoin price",
      number_of_results: 42000,
      results: [
        {
          title: "Bitcoin Price Today",
          url: "https://example.com/btc",
          content: "Current BTC price is $50,000",
          engine: "google",
          published_date: "2024-01-15T10:30:00Z",
          author: "Crypto News",
          thumbnail_src: "https://example.com/thumb.jpg",
          img_src: "https://example.com/img.jpg",
          category: "web",
        },
        {
          title: "BTC Live Chart",
          url: "https://example.com/chart",
          content: "Real-time chart",
          engine: "bing",
          category: "web",
        },
      ],
      suggestions: ["bitcoin", "btc usd"],
      corrections: ["bitcoin price usd"],
      infoboxes: [
        {
          infobox: "Bitcoin",
          img_src: "https://example.com/btc-logo.png",
          content: "Bitcoin is a cryptocurrency...",
          attributes: [
            { label: "Symbol", value: "BTC" },
            { label: "Market Cap", value: "$1T" },
          ],
          urls: [
            { url: "https://bitcoin.org", title: "Official Website" },
          ],
          relatedTopics: [
            {
              name: "crypto",
              suggestions: [{ suggestion: "ethereum" }, { suggestion: "dogecoin" }],
            },
          ],
        },
      ],
      unresponsive_engines: [
        ["duckduckgo", "Connection timeout"],
        ["brave", "Too many requests"],
      ],
    };

    const response = mapRawResponse(raw);

    // Query
    expect(response.query).toBe("bitcoin price");

    // Results
    expect(response.results).toHaveLength(2);
    expect(response.results[0]!.title).toBe("Bitcoin Price Today");
    expect(response.results[0]!.url).toBe("https://example.com/btc");
    expect(response.results[0]!.content).toBe("Current BTC price is $50,000");
    expect(response.results[0]!.engine).toBe("google");
    expect(response.results[0]!.publishedDate).toBe("2024-01-15T10:30:00Z");
    expect(response.results[0]!.author).toBe("Crypto News");
    expect(response.results[0]!.thumbnail).toBe("https://example.com/thumb.jpg");
    expect(response.results[0]!.imgSrc).toBe("https://example.com/img.jpg");
    expect(response.results[0]!.category).toBe("web");

    // Second result with optional fields missing
    expect(response.results[1]!.title).toBe("BTC Live Chart");
    expect(response.results[1]!.publishedDate).toBeUndefined();
    expect(response.results[1]!.author).toBeUndefined();
    expect(response.results[1]!.thumbnail).toBeUndefined();
    expect(response.results[1]!.imgSrc).toBeUndefined();

    // Suggestions & corrections
    expect(response.suggestions).toEqual(["bitcoin", "btc usd"]);
    expect(response.corrections).toEqual(["bitcoin price usd"]);

    // Infobox
    expect(response.infobox).toBeDefined();
    expect(response.infobox!.title).toBe("Bitcoin");
    expect(response.infobox!.imgSrc).toBe("https://example.com/btc-logo.png");
    expect(response.infobox!.content).toBe("Bitcoin is a cryptocurrency...");
    expect(response.infobox!.attributes).toHaveLength(2);
    expect(response.infobox!.attributes[0]!.label).toBe("Symbol");
    expect(response.infobox!.attributes[0]!.value).toBe("BTC");
    expect(response.infobox!.urls).toHaveLength(1);
    expect(response.infobox!.urls[0]!.url).toBe("https://bitcoin.org");
    expect(response.infobox!.relatedTopics).toHaveLength(1);
    expect(response.infobox!.relatedTopics[0]!.name).toBe("crypto");
    expect(response.infobox!.relatedTopics[0]!.suggestions).toEqual([
      "ethereum",
      "dogecoin",
    ]);

    // Unresponsive engines
    expect(response.unresponsiveEngines).toHaveLength(2);
    expect(response.unresponsiveEngines[0]).toEqual([
      "duckduckgo",
      "Connection timeout",
    ]);
    expect(response.unresponsiveEngines[1]).toEqual([
      "brave",
      "Too many requests",
    ]);
  });

  test("should handle empty response", () => {
    const response = mapRawResponse({});

    expect(response.query).toBe("");
    expect(response.results).toEqual([]);
    expect(response.suggestions).toEqual([]);
    expect(response.corrections).toEqual([]);
    expect(response.infobox).toBeUndefined();
    expect(response.unresponsiveEngines).toEqual([]);
  });

  test("should handle missing results array", () => {
    const response = mapRawResponse({ query: "test", results: null });
    expect(response.results).toEqual([]);
  });

  test("should handle missing suggestions/corrections", () => {
    const response = mapRawResponse({ query: "test" });
    expect(response.suggestions).toEqual([]);
    expect(response.corrections).toEqual([]);
  });

  test("should handle empty infoboxes array", () => {
    const response = mapRawResponse({ query: "test", infoboxes: [] });
    expect(response.infobox).toBeUndefined();
  });

  test("should handle infobox with missing optional fields", () => {
    const response = mapRawResponse({
      query: "test",
      infoboxes: [
        {
          infobox: "Test Title",
        },
      ],
    });

    expect(response.infobox).toBeDefined();
    expect(response.infobox!.title).toBe("Test Title");
    expect(response.infobox!.imgSrc).toBeUndefined();
    expect(response.infobox!.content).toBeUndefined();
    expect(response.infobox!.attributes).toEqual([]);
    expect(response.infobox!.urls).toEqual([]);
    expect(response.infobox!.relatedTopics).toEqual([]);
  });

  test("should handle malformed unresponsive_engines entries", () => {
    const response = mapRawResponse({
      query: "test",
      unresponsive_engines: [
        ["valid", "error"],
        "not_an_array",
        [1],
        ["engine", "reason", "extra"],
      ],
    });

    // Only valid entries (arrays with >= 2 elements)
    expect(response.unresponsiveEngines).toHaveLength(2);
    expect(response.unresponsiveEngines[0]).toEqual(["valid", "error"]);
    expect(response.unresponsiveEngines[1]).toEqual(["engine", "reason"]);
  });

  test("should map publishedDate from both field names", () => {
    const withSnakeCase = mapRawResponse({
      query: "test",
      results: [
        {
          title: "A",
          url: "http://a.com",
          content: "",
          engine: "g",
          published_date: "2024-01-01",
        },
      ],
    });
    expect(withSnakeCase.results[0]!.publishedDate).toBe("2024-01-01");

    const withCamelCase = mapRawResponse({
      query: "test",
      results: [
        {
          title: "B",
          url: "http://b.com",
          content: "",
          engine: "g",
          publishedDate: "2024-02-01",
        },
      ],
    });
    expect(withCamelCase.results[0]!.publishedDate).toBe("2024-02-01");
  });

  test("should handle result with null content fields as empty strings", () => {
    const response = mapRawResponse({
      query: "test",
      results: [
        {
          title: null,
          url: null,
          content: null,
          engine: null,
        },
      ],
    });

    expect(response.results[0]!.title).toBe("");
    expect(response.results[0]!.url).toBe("");
    expect(response.results[0]!.content).toBe("");
    expect(response.results[0]!.engine).toBe("");
  });
});
