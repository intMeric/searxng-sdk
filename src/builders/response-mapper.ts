import type {
  SearchResponse,
  SearchResult,
  Infobox,
  InfoboxAttribute,
  InfoboxUrl,
  InfoboxRelatedTopic,
  UnresponsiveEngine,
} from "../types/search-response.ts";

type RawRecord = Record<string, unknown>;
type RawResponse = Record<string, unknown>;

export function mapRawResponse(raw: RawResponse): SearchResponse {
  return {
    query: String(raw["query"] ?? ""),
    results: mapResults(raw["results"]),
    suggestions: mapStringArray(raw["suggestions"]),
    corrections: mapStringArray(raw["corrections"]),
    infobox: raw["infoboxes"] ? mapInfobox(raw["infoboxes"]) : undefined,
    unresponsiveEngines: mapUnresponsiveEngines(raw["unresponsive_engines"]),
  };
}

function mapResults(raw: unknown): SearchResult[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((r: RawRecord) => ({
    title: String(r["title"] ?? ""),
    url: String(r["url"] ?? ""),
    content: String(r["content"] ?? ""),
    engine: String(r["engine"] ?? ""),
    publishedDate: optionalString(r["publishedDate"] ?? r["published_date"]),
    author: optionalString(r["author"]),
    thumbnail: optionalString(r["thumbnail"] ?? r["thumbnail_src"]),
    imgSrc: optionalString(r["img_src"]),
    category: optionalString(r["category"]),
  }));
}

function mapInfobox(raw: unknown): Infobox | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const box = raw[0] as RawRecord;
  return {
    title: String(box["infobox"] ?? ""),
    imgSrc: optionalString(box["img_src"]),
    content: optionalString(box["content"]),
    attributes: mapInfoboxAttributes(box["attributes"]),
    urls: mapInfoboxUrls(box["urls"]),
    relatedTopics: mapInfoboxRelatedTopics(box["relatedTopics"]),
  };
}

function mapInfoboxAttributes(raw: unknown): InfoboxAttribute[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a: Record<string, unknown>) => ({
    label: String(a["label"] ?? ""),
    value: String(a["value"] ?? ""),
  }));
}

function mapInfoboxUrls(raw: unknown): InfoboxUrl[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((u: Record<string, unknown>) => ({
    url: String(u["url"] ?? ""),
    title: String(u["title"] ?? ""),
  }));
}

function mapInfoboxRelatedTopics(raw: unknown): InfoboxRelatedTopic[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: Record<string, unknown>) => ({
    name: String(t["name"] ?? ""),
    suggestions: mapStringArray(
      Array.isArray(t["suggestions"])
        ? t["suggestions"].map(
            (s: Record<string, unknown>) => s["suggestion"] ?? s,
          )
        : undefined,
    ),
  }));
}

function mapUnresponsiveEngines(raw: unknown): UnresponsiveEngine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is [unknown, unknown] => Array.isArray(e) && e.length >= 2)
    .map((e) => [String(e[0]), String(e[1])] as UnresponsiveEngine);
}

function mapStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String);
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}
