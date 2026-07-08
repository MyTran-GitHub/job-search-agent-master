import { stripHtml } from "../../utils/text_normalizer.js";
import type { RawJobInput } from "../normalize_job.js";

interface GreenhouseJob {
  id: number;
  title: string;
  location?: { name: string };
  content?: string;
  absolute_url?: string;
  updated_at?: string;
}

export async function fetchGreenhouseJobs(
  token: string,
  companyName?: string
): Promise<RawJobInput[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Greenhouse fetch failed (${response.status})`);
  }

  const data = (await response.json()) as { jobs: GreenhouseJob[] };
  const company = companyName ?? token;

  return data.jobs.map((job) => ({
    title: job.title,
    company,
    description: stripHtml(job.content ?? ""),
    location: job.location?.name ?? "Unknown",
    source_url: job.absolute_url ?? `https://boards.greenhouse.io/${token}/jobs/${job.id}`,
    source: "greenhouse" as const,
    posting_age: job.updated_at,
  }));
}
