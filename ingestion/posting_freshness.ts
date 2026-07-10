import type { Job } from "../utils/schema_validator.js";
import type { RawJobInput } from "./normalize_job.js";

export const DEFAULT_MAX_POSTING_AGE_DAYS = 10;

export function daysToRecencyMinutes(days: number): number {
  return Math.max(1, Math.round(days * 24 * 60));
}

export function parsePostingDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();

  if (/^\d{10,13}$/.test(trimmed)) {
    const n = Number(trimmed);
    return new Date(n < 1e12 ? n * 1000 : n);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

export function extractPostingDateFromText(text: string): Date | null {
  const relativePatterns: Array<{
    re: RegExp;
    toDate: (n: number, now: Date) => Date;
  }> = [
    {
      re: /posted\s+(?:about\s+)?(\d+)\s+minutes?\s+ago/i,
      toDate: (n, now) => new Date(now.getTime() - n * 60_000),
    },
    {
      re: /posted\s+(?:about\s+)?(\d+)\s+hours?\s+ago/i,
      toDate: (n, now) => new Date(now.getTime() - n * 3_600_000),
    },
    {
      re: /posted\s+(?:about\s+)?(\d+)\s+days?\s+ago/i,
      toDate: (n, now) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
      },
    },
    {
      re: /posted\s+(?:about\s+)?(\d+)\s+weeks?\s+ago/i,
      toDate: (n, now) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n * 7);
        return d;
      },
    },
    {
      re: /posted\s+(?:about\s+)?(\d+)\s+months?\s+ago/i,
      toDate: (n, now) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - n);
        return d;
      },
    },
  ];

  const now = new Date();
  for (const { re, toDate } of relativePatterns) {
    const match = text.match(re);
    if (match) return toDate(parseInt(match[1], 10), now);
  }

  const postedOn = text.match(
    /posted\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i
  );
  if (postedOn) {
    const parsed = new Date(postedOn[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const datePosted = text.match(/"datePosted"\s*:\s*"([^"]+)"/i);
  if (datePosted) {
    const parsed = parsePostingDate(datePosted[1]);
    if (parsed) return parsed;
  }

  return null;
}

export function resolvePostingDate(input: {
  posting_age?: string;
  description?: string;
}): Date | null {
  const fromAge = parsePostingDate(input.posting_age);
  if (fromAge) return fromAge;
  if (input.description) {
    return extractPostingDateFromText(input.description);
  }
  return null;
}

export function getPostingAgeDays(postedDate: Date, now = new Date()): number {
  return (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
}

/** True when `scraped_at` is within maxDays of now (rank-time safety net). */
export function isScrapeFresh(
  scrapedAt: string | undefined,
  maxDays: number,
  now = new Date()
): boolean {
  if (!scrapedAt?.trim()) return false;
  const parsed = parsePostingDate(scrapedAt);
  if (!parsed) return false;
  const ageDays = getPostingAgeDays(parsed, now);
  return ageDays >= 0 && ageDays <= maxDays;
}

export interface FreshnessDecision {
  fresh: boolean;
  reason: string;
  postedDate?: Date;
  ageDays?: number;
}

export function isFreshPosting(
  input: { posting_age?: string; description?: string },
  maxDays: number,
  now = new Date()
): FreshnessDecision {
  const postedDate = resolvePostingDate(input);
  if (!postedDate) {
    return { fresh: false, reason: "no_posting_date" };
  }

  const ageDays = getPostingAgeDays(postedDate, now);
  if (ageDays < 0) {
    return {
      fresh: true,
      reason: "future_date_treated_fresh",
      postedDate,
      ageDays,
    };
  }
  if (ageDays > maxDays) {
    return {
      fresh: false,
      reason: `posted_${Math.round(ageDays)}_days_ago`,
      postedDate,
      ageDays,
    };
  }
  return { fresh: true, reason: "within_window", postedDate, ageDays };
}

export function filterFreshRawJobs<T extends RawJobInput>(
  jobs: T[],
  maxDays: number
): { kept: T[]; dropped: Array<{ job: T; reason: string }> } {
  const kept: T[] = [];
  const dropped: Array<{ job: T; reason: string }> = [];

  for (const job of jobs) {
    const decision = isFreshPosting(job, maxDays);
    if (decision.fresh) {
      kept.push(job);
    } else {
      dropped.push({ job, reason: decision.reason });
    }
  }

  return { kept, dropped };
}

export function filterFreshJobs(
  jobs: Job[],
  maxDays: number
): { kept: Job[]; dropped: Array<{ job: Job; reason: string }> } {
  const kept: Job[] = [];
  const dropped: Array<{ job: Job; reason: string }> = [];

  for (const job of jobs) {
    const decision = isFreshPosting(job, maxDays);
    if (decision.fresh) {
      kept.push(job);
    } else {
      dropped.push({ job, reason: decision.reason });
    }
  }

  return { kept, dropped };
}
