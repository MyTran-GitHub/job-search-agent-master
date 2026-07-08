import { stripHtml } from "../../utils/text_normalizer.js";
import type { RawJobInput } from "../normalize_job.js";

interface LeverPosting {
  id: string;
  text: string;
  categories?: {
    location?: string;
    commitment?: string;
  };
  description?: string;
  descriptionPlain?: string;
  hostedUrl?: string;
  createdAt?: number;
}

export async function fetchLeverJobs(
  site: string,
  companyName?: string
): Promise<RawJobInput[]> {
  const url = `https://api.lever.co/v0/postings/${site}?mode=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lever fetch failed (${response.status})`);
  }

  const postings = (await response.json()) as LeverPosting[];
  const company = companyName ?? site;

  return postings.map((posting) => ({
    title: posting.text,
    company,
    description: stripHtml(
      posting.descriptionPlain ?? posting.description ?? ""
    ),
    location: posting.categories?.location ?? "Unknown",
    employment_type: posting.categories?.commitment,
    source_url: posting.hostedUrl ?? `https://jobs.lever.co/${site}/${posting.id}`,
    source: "lever" as const,
    posting_age: posting.createdAt
      ? new Date(posting.createdAt).toISOString()
      : undefined,
  }));
}
