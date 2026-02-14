import type { SearxngClientConfig, ResolvedConfig } from "./types/config.ts";
import { SearxngError } from "./errors/searxng-error.ts";
import { SearchBuilder } from "./builders/search.builder.ts";

export class SearxngClient {
  private readonly config: ResolvedConfig;

  constructor(config: SearxngClientConfig) {
    if (!config.baseUrl?.trim()) {
      throw new SearxngError("baseUrl is required", 0);
    }

    if (config.timeout !== undefined && config.timeout <= 0) {
      throw new SearxngError("timeout must be > 0", 0);
    }

    if (
      config.retry?.maxRetries !== undefined &&
      config.retry.maxRetries < 0
    ) {
      throw new SearxngError("retry.maxRetries must be >= 0", 0);
    }

    this.config = {
      baseUrl: config.baseUrl.replace(/\/+$/, ""),
      timeout: config.timeout ?? 10_000,
      retry: {
        maxRetries: config.retry?.maxRetries ?? 3,
        baseDelayMs: config.retry?.baseDelayMs ?? 1_000,
      },
      defaultLanguage: config.defaultLanguage,
      defaultCategories: config.defaultCategories,
      defaultSafesearch: config.defaultSafesearch,
      headers: config.headers ?? {},
    };
  }

  search(query: string): SearchBuilder {
    return new SearchBuilder(query, this.config);
  }
}
