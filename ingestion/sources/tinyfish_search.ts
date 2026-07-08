import type { AppConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export interface TinyFishSearchResult {
  url: string;
  title?: string;
  company?: string;
  snippet?: string;
}

export interface TinyFishSearchOptions {
  query: string;
  limit?: number;
}

export async function tinyfishSearch(
  config: AppConfig,
  options: TinyFishSearchOptions
): Promise<TinyFishSearchResult[]> {
  const { apiKey, baseUrl } = config.tinyfish;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY is required for search");
  }

  const url = `${baseUrl}/search`;
  logger.info(`TinyFish search: "${options.query}"`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: options.query,
      limit: options.limit ?? 20,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TinyFish search failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      url: string;
      title?: string;
      company?: string;
      snippet?: string;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    url: r.url,
    title: r.title,
    company: r.company,
    snippet: r.snippet,
  }));
}

export function parseSearchQueries(careerGoalsMarkdown: string): string[] {
  const queries: string[] = [];
  const inSearchSection = careerGoalsMarkdown.match(
    /## Search Queries[\s\S]*?(?=##|$)/i
  );
  if (!inSearchSection) return ["geospatial engineer entry level"];

  const lines = inSearchSection[0].split("\n");
  for (const line of lines) {
    const match = line.match(/^-\s+(.+)$/);
    if (match) queries.push(match[1].trim());
  }

  return queries.length > 0 ? queries : ["geospatial engineer entry level"];
}

export async function searchAllQueries(
  config: AppConfig,
  queries: string[],
  limitPerQuery = 15
): Promise<TinyFishSearchResult[]> {
  const all: TinyFishSearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const results = await tinyfishSearch(config, {
        query,
        limit: limitPerQuery,
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
