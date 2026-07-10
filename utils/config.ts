import dotenv from "dotenv";
import { PATHS } from "./constants.js";

dotenv.config({ path: PATHS.library.replace("/library", "/.env") });

export interface AppConfig {
  tinyfish: {
    apiKey: string;
    searchUrl: string;
    fetchUrl: string;
  };
  jsearch?: {
    rapidApiKey: string;
  };
  scrape: {
    maxPostingAgeDays: number;
  };
  rateLimit: {
    concurrency: number;
  };
}

export function loadConfig(): AppConfig {
  const apiKey = process.env.TINYFISH_API_KEY ?? "";
  const searchUrl =
    process.env.TINYFISH_SEARCH_URL ?? "https://api.search.tinyfish.ai";
  const fetchUrl =
    process.env.TINYFISH_FETCH_URL ?? "https://api.fetch.tinyfish.ai";

  const jsearchKey = process.env.JSEARCH_RAPIDAPI_KEY;

  return {
    tinyfish: {
      apiKey,
      searchUrl,
      fetchUrl,
    },
    jsearch: jsearchKey ? { rapidApiKey: jsearchKey } : undefined,
    scrape: {
      maxPostingAgeDays: Number(
        process.env.SCRAPE_MAX_POSTING_AGE_DAYS ?? "10"
      ),
    },
    rateLimit: {
      concurrency: Number(process.env.SCRAPE_CONCURRENCY ?? "3"),
    },
  };
}

export function requireTinyFishKey(config: AppConfig): string {
  if (!config.tinyfish.apiKey) {
    throw new Error(
      "TINYFISH_API_KEY is required. Set it in .env (see .env.example)."
    );
  }
  return config.tinyfish.apiKey;
}
