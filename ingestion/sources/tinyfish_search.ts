import type { AppConfig } from "../../utils/config.js";
import { daysToRecencyMinutes } from "../posting_freshness.js";
import { logger } from "../../utils/logger.js";

export interface TinyFishSearchResult {
  url: string;
  title?: string;
  company?: string;
  snippet?: string;
  date?: string;
}

export interface TinyFishSearchOptions {
  query: string;
  limit?: number;
  recencyMinutes?: number;
  location?: string;
  language?: string;
}

function tinyfishHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    Accept: "application/json",
  };
}

export async function tinyfishSearch(
  config: AppConfig,
  options: TinyFishSearchOptions
): Promise<TinyFishSearchResult[]> {
  const { apiKey, searchUrl } = config.tinyfish;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY is required for search");
  }

  const params = new URLSearchParams({
    query: options.query,
    location: options.location ?? "US",
    language: options.language ?? "en",
  });

  if (options.recencyMinutes) {
    params.set("recency_minutes", String(options.recencyMinutes));
  }

  const url = `${searchUrl}?${params.toString()}`;
  logger.info(`TinyFish search: "${options.query}"`);

  const response = await fetch(url, {
    method: "GET",
    headers: tinyfishHeaders(apiKey),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TinyFish search failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      url: string;
      title?: string;
      site_name?: string;
      snippet?: string;
      date?: string;
    }>;
  };

  const limit = options.limit ?? 20;
  return (data.results ?? []).slice(0, limit).map((r) => ({
    url: r.url,
    title: r.title,
    company: r.site_name,
    snippet: r.snippet,
    date: r.date,
  }));
}

export function parseSearchQueries(careerGoalsMarkdown: string): string[] {
  const queries: string[] = [];
  const inSearchSection = careerGoalsMarkdown.match(
    /## Search Queries[\s\S]*?(?=##|$)/i
  );
  if (!inSearchSection) return ["entry level earth observation geospatial San Francisco"];

  const lines = inSearchSection[0].split("\n");
  for (const line of lines) {
    const match = line.match(/^-\s+(.+)$/);
    if (match) queries.push(match[1].trim());
  }

  return queries.length > 0
    ? queries
    : ["entry level earth observation geospatial San Francisco"];
}

export async function searchAllQueries(
  config: AppConfig,
  queries: string[],
  limitPerQuery = 15,
  recencyMinutes?: number
): Promise<TinyFishSearchResult[]> {
  const all: TinyFishSearchResult[] = [];
  const seenUrls = new Set<string>();
  const recency =
    recencyMinutes ??
    daysToRecencyMinutes(config.scrape.maxPostingAgeDays);

  for (const query of queries) {
    try {
      const results = await tinyfishSearch(config, {
        query,
        limit: limitPerQuery,
        recencyMinutes: recency,
      });
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          all.push(r);
        }
      }
    } catch (err) {
      logger.warn(`Search failed for query "${query}"`, err);
    }
  }

  return all;
}
