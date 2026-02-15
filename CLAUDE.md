# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build:** `bun run build` (uses tsup, outputs ESM + CJS + DTS to `dist/`)
- **Type check:** `bun run check` (runs `tsc --noEmit`)
- **Test all:** `bun test`
- **Test single file:** `bun test tests/retry.test.ts`
- **Dev (watch mode):** `bun run dev`

## Architecture

Zero-dependency TypeScript SDK for querying SearXNG instances. Uses Bun as the runtime/test runner and tsup for bundling.

### Request flow

`SearxngClient.search(query)` → `SearchBuilder` (fluent chainable API) → `.execute()` → `withRetry(fetchJson(...))` → `mapRawResponse(data)` → `SearchResponse`

### Key modules

- **`src/client.ts`** — `SearxngClient` class. Validates config, resolves defaults, creates `SearchBuilder` instances.
- **`src/builders/search.builder.ts`** — `SearchBuilder` with chainable methods (`.categories()`, `.engines()`, `.language()`, `.page()`, `.timeRange()`, `.safesearch()`). Single-use: throws if `.execute()` is called twice.
- **`src/builders/response-mapper.ts`** — Defensive mapping from raw JSON (`Record<string, unknown>`) to typed `SearchResponse`. Handles field name variants from the SearXNG API (e.g. `publishedDate` vs `published_date`, `thumbnail` vs `thumbnail_src`).
- **`src/http/fetch.ts`** — `fetchJson()` wrapper with timeout via `AbortController`, custom header merging, and `Retry-After` header parsing. Returns 403 as a specific "JSON format not enabled" error.
- **`src/http/retry.ts`** — `withRetry()` with exponential backoff. Only retries on HTTP 429; respects `Retry-After` header.
- **`src/errors/searxng-error.ts`** — `SearxngError` with `status` and optional `retryAfter` fields.
- **`src/types/`** — Type definitions split into `config.ts` (client config + resolved config), `search-params.ts` (query params), `search-response.ts` (response types).

### Conventions

- All internal imports use `.ts` extensions (`import { ... } from "./foo.ts"`).
- TypeScript strict mode with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`.
- The library is zero-dependency — only uses the global `fetch` API.
- Types are exported separately from runtime values in `src/index.ts` using `export type`.
