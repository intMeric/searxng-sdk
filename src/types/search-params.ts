import type { SafeSearch } from "./config.ts";

export type TimeRange = "day" | "week" | "month" | "year";

export interface SearchParams {
  q: string;
  categories?: string;
  engines?: string;
  language?: string;
  pageno?: number;
  time_range?: TimeRange;
  safesearch?: SafeSearch;
  format: "json";
}
