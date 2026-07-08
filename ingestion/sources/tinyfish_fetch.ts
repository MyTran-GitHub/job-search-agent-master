import type { AppConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";
import type { RawJobInput } from "../normalize_job.js";

export interface TinyFishFetchResult {
  url: string;
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  raw?: unknown;
}

export async function tinyfishFetch(
  config: AppConfig,
  url: string
): Promise<TinyFishFetchResult> {
  const { apiKey, baseUrl } = config.tinyfish;
  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY is required for fetch");
  }

  const fetchUrl = `${baseUrl}/fetch`;
  logger.debug(`TinyFish fetch: ${url}`);

  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TinyFish fetch failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    url?: string;
    title?: string;
    company?: string;
    description?: string;
    content?: string;
    location?: string;
    text?: string;
  };

  return {
    url: data.url ?? url,
    title: data.title,
    company: data.company,
    description: data.description ?? data.content ?? data.text,
    location: data.location,
    raw: data,
  };
}

export function fetchResultToRawJob(
  result: TinyFishFetchResult
): RawJobInput | null {
  if (!result.title || !result.description) {
    return null;
  }

  const company =
    result.company ??
    extractCompanyFromUrl(result.url) ??
    "Unknown Company";

  return {
    title: result.title,
    company,
    description: result.description,
    location: result.location,
    source_url: result.url,
    source: "tinyfish",
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
