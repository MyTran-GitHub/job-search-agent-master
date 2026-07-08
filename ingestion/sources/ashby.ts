import { stripHtml } from "../../utils/text_normalizer.js";
import type { RawJobInput } from "../normalize_job.js";

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  jobUrl?: string;
  publishedAt?: string;
  employmentType?: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export async function fetchAshbyJobs(
  board: string,
  companyName?: string
): Promise<RawJobInput[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ashby fetch failed (${response.status})`);
  }

  const data = (await response.json()) as AshbyResponse;
  const company = companyName ?? board;

  return data.jobs.map((job) => ({
    title: job.title,
    company,
    description: stripHtml(
      job.descriptionPlain ?? job.descriptionHtml ?? ""
    ),
    location: job.location ?? "Unknown",
    employment_type: job.employmentType,
    source_url: job.jobUrl ?? `https://jobs.ashbyhq.com/${board}/${job.id}`,
    source: "ashby" as const,
    posting_age: job.publishedAt,
  }));
}
