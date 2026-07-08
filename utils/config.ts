import dotenv from "dotenv";
import { PATHS } from "./constants.js";

dotenv.config({ path: PATHS.library.replace("/library", "/.env") });

export interface AppConfig {
  tinyfish: {
    apiKey: string;
    baseUrl: string;
  };
  jsearch?: {
    rapidApiKey: string;
  };
  rateLimit: {
    concurrency: number;
  };
}

export function loadConfig(): AppConfig {
  const apiKey = process.env.TINYFISH_API_KEY ?? "";
  const baseUrl =
    process.env.TINYFISH_BASE_URL ?? "https://api.tinyfish.ai/v1";

  const jsearchKey = process.env.JSEARCH_RAPIDAPI_KEY;

  return {
    tinyfish: {
      apiKey,
      baseUrl,
    },
    jsearch: jsearchKey ? { rapidApiKey: jsearchKey } : undefined,
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
