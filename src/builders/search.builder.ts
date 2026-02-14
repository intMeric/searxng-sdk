import type { SafeSearch, ResolvedConfig } from "../types/config.ts";
import type { SearchParams, TimeRange } from "../types/search-params.ts";
import type { SearchResponse } from "../types/search-response.ts";
import { SearxngError } from "../errors/searxng-error.ts";
import { fetchJson } from "../http/fetch.ts";
import { withRetry } from "../http/retry.ts";
import { mapRawResponse } from "./response-mapper.ts";

export class SearchBuilder {
  private readonly params: SearchParams;
  private readonly config: ResolvedConfig;
  private executed = false;

  constructor(query: string, config: ResolvedConfig) {
    if (!query.trim()) {
      throw new SearxngError("Search query must not be empty", 0);
    }

    this.config = config;
    this.params = {
      q: query,
      format: "json",
      language: config.defaultLanguage,
      categories: config.defaultCategories?.join(","),
      safesearch: config.defaultSafesearch,
    };
  }

  categories(...categories: string[]): this {
    this.params.categories = categories.join(",");
    return this;
  }

  engines(...engines: string[]): this {
    this.params.engines = engines.join(",");
    return this;
  }

  language(lang: string): this {
    this.params.language = lang;
    return this;
  }

  page(pageno: number): this {
    if (pageno < 1) {
      throw new SearxngError("Page number must be >= 1", 0);
    }
    this.params.pageno = pageno;
    return this;
  }

  timeRange(range: TimeRange): this {
    this.params.time_range = range;
    return this;
  }

  safesearch(level: SafeSearch): this {
    this.params.safesearch = level;
    return this;
  }

  async execute(): Promise<SearchResponse> {
    if (this.executed) {
      throw new SearxngError("Builder already executed", 0);
    }
    this.executed = true;

    const url = this.buildUrl();

    const { data } = await withRetry(
      () =>
        fetchJson<Record<string, unknown>>(url, {
          timeout: this.config.timeout,
          headers: this.config.headers,
        }),
      this.config.retry,
    );

    return mapRawResponse(data);
  }

  private buildUrl(): string {
    const url = new URL("/search", this.config.baseUrl);

    for (const [key, value] of Object.entries(this.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}
