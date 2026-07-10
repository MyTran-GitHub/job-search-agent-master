import type { AppConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";
import type { RawJobInput } from "../normalize_job.js";

export interface TinyFishFetchResult {
  url: string;
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  published_date?: string;
  raw?: unknown;
}

function tinyfishHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function tinyfishFetch(
  config: AppConfig,
  url: string
): Promise<TinyFishFetchResult> {
  const { apiKey, fetchUrl } = config.tinyfish;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY is required for fetch");
  }

  logger.debug(`TinyFish fetch: ${url}`);

  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: tinyfishHeaders(apiKey),
    body: JSON.stringify({
      urls: [url],
      format: "markdown",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TinyFish fetch failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      url?: string;
      final_url?: string;
      title?: string;
      description?: string;
      published_date?: string | null;
      text?: string;
    }>;
    errors?: Array<{ url?: string; error?: string }>;
  };

  if (data.errors?.length) {
    const err = data.errors.find((e) => e.url === url) ?? data.errors[0];
    throw new Error(
      `TinyFish fetch error for ${url}: ${err.error ?? "unknown"}`
    );
  }

  const page = data.results?.[0];
  if (!page) {
    throw new Error(`TinyFish fetch returned no result for ${url}`);
  }

  return {
    url: page.final_url ?? page.url ?? url,
    title: page.title ?? undefined,
    description: page.text ?? page.description ?? undefined,
    published_date: page.published_date ?? undefined,
    raw: data,
  };
}

export function fetchResultToRawJob(
  result: TinyFishFetchResult,
  hints?: { company?: string; posting_age?: string }
): RawJobInput | null {
  if (!result.title || !result.description) {
    return null;
  }

  const company =
    result.company ??
    hints?.company ??
    extractCompanyFromUrl(result.url) ??
    "Unknown Company";

  return {
    title: result.title,
    company,
    description: result.description,
    location: result.location,
    source_url: result.url,
    source: "tinyfish",
    posting_age: result.published_date ?? hints?.posting_age,
  };
}

function extractCompanyFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.replace("www.", "").split(".");
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch {
    return null;
  }
  return null;
}
