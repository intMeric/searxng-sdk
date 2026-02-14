export type SafeSearch = 0 | 1 | 2;

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface SearxngClientConfig {
  baseUrl: string;
  timeout?: number;
  retry?: RetryConfig;
  defaultLanguage?: string;
  defaultCategories?: string[];
  defaultSafesearch?: SafeSearch;
  headers?: Record<string, string>;
}

export interface ResolvedConfig {
  baseUrl: string;
  timeout: number;
  retry: Required<RetryConfig>;
  defaultLanguage?: string;
  defaultCategories?: string[];
  defaultSafesearch?: SafeSearch;
  headers: Record<string, string>;
}
