# searxng-sdk

Zero-dependency TypeScript SDK for the [SearXNG](https://docs.searxng.org/) search API.

## Install

```bash
npm install searxng-sdk
# or
bun add searxng-sdk
```

## Usage

```ts
import { SearxngClient } from "searxng-sdk";

const client = new SearxngClient({ baseUrl: "http://localhost:8888" });

const { results } = await client
  .search("bitcoin price")
  .categories("news")
  .language("fr")
  .timeRange("day")
  .execute();
```

## API

### `new SearxngClient(config)`

| Option              | Type                          | Default       | Description                           |
| ------------------- | ----------------------------- | ------------- | ------------------------------------- |
| `baseUrl`           | `string`                      | **required**  | SearXNG instance URL                  |
| `timeout`           | `number`                      | `10000`       | Request timeout in ms                 |
| `retry`             | `{ maxRetries, baseDelayMs }` | `{ 3, 1000 }` | Retry on 429 with exponential backoff |
| `defaultLanguage`   | `string`                      | —             | Applied to all searches               |
| `defaultCategories` | `string[]`                    | —             | Applied to all searches               |
| `defaultSafesearch` | `0 \| 1 \| 2`                 | —             | Applied to all searches               |
| `headers`           | `Record<string, string>`      | —             | Custom headers (e.g. proxy auth)      |

### `client.search(query)`

Returns a `SearchBuilder` with chainable methods:

```ts
.categories(...categories: string[])  // "general", "news", "images", "videos", "it", "science", ...
.engines(...engines: string[])        // "google", "bing", "duckduckgo", "wikipedia", ...
.language(lang: string)               // "en", "fr", "de", ...
.page(n: number)                      // >= 1
.timeRange(range)                     // "day" | "week" | "month" | "year"
.safesearch(level)                    // 0 (off) | 1 (moderate) | 2 (strict)
.execute()                            // → Promise<SearchResponse>
```

### `SearchResponse`

```ts
{
  query: string;
  numberOfResults: number;
  results: SearchResult[];
  answers: Answer[];
  suggestions: string[];
  corrections: string[];
  infobox?: Infobox;
  unresponsiveEngines: [string, string][];
}
```

### `SearchResult`

```ts
{
  title: string;
  url: string;
  content: string;
  engine: string;
  engines: string[];             // all engines that returned this result
  positions: number[];           // position in each engine
  score: number;                 // relevance score
  publishedDate?: string;
  pubdate?: string;              // alternative date format
  author?: string;
  thumbnail?: string;
  imgSrc?: string;
  category?: string;
  metadata?: string;             // e.g. "1/28/2026 | Seeking Alpha"
  template?: string;             // "default.html", "images.html", "videos.html", ...
  parsedUrl?: string[];          // URL split into segments
  priority?: string;
}
```

### `Answer`

```ts
{
  answer: string;                // direct answer text
  url: string;                   // source URL
  engine: string;                // engine that provided the answer
  template?: string;
  parsedUrl?: string[];
}
```

### `Infobox`

```ts
{
  title: string;
  imgSrc?: string;
  content?: string;
  attributes: { label: string; value: string }[];
  urls: { url: string; title: string }[];
  relatedTopics: { name: string; suggestions: string[] }[];
}
```

## Prerequisites

You can run Searxng with docker : [Searxng documentation](https://docs.searxng.org/admin/installation-docker.html)

Your SearXNG instance must have JSON format enabled in `settings.yml`:

```yaml
search:
  formats:
    - html
    - json
```

## Compatibility

Node.js 18+ / Bun / Deno

## License

MIT
