import type { Job } from "../utils/schema_validator.js";
import {
  normalizeCompany,
  normalizeTitle,
} from "../utils/text_normalizer.js";

export function dedupeKey(job: Job): string {
  return `${normalizeCompany(job.company)}|${normalizeTitle(job.title)}|${job.location.toLowerCase()}`;
}

export function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();

  for (const job of jobs) {
    const key = dedupeKey(job);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, job);
      continue;
    }
    // Prefer job with longer description (more complete JD)
    if (job.description.length > existing.description.length) {
      seen.set(key, job);
    }
  }

  return Array.from(seen.values());
}
