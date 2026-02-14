export { SearxngClient } from "./client.ts";
export { SearchBuilder } from "./builders/search.builder.ts";
export { SearxngError } from "./errors/searxng-error.ts";

export type {
  SearxngClientConfig,
  SafeSearch,
  RetryConfig,
} from "./types/config.ts";
export type { TimeRange } from "./types/search-params.ts";
export type {
  SearchResponse,
  SearchResult,
  Infobox,
  InfoboxAttribute,
  InfoboxUrl,
  InfoboxRelatedTopic,
  UnresponsiveEngine,
} from "./types/search-response.ts";
