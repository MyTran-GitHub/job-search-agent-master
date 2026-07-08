import crypto from "node:crypto";
import type { JobSource } from "../utils/constants.js";
import type { Job } from "../utils/schema_validator.js";
import {
  normalizeWhitespace,
  stripHtml,
} from "../utils/text_normalizer.js";

export interface RawJobInput {
  title: string;
  company: string;
  description: string;
  location?: string;
  source_url: string;
  source: JobSource;
  employment_type?: string;
  visa_policy?: string;
  experience_level?: string;
  sponsorship_status?: "likely" | "unlikely" | "unknown";
  posting_age?: string;
  requirements?: string[];
}

export function generateJobId(
  company: string,
  title: string,
  sourceUrl: string
): string {
  const key = `${company}|${title}|${sourceUrl}`.toLowerCase();
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

export function extractRequirements(description: string): string[] {
  const text = stripHtml(description);
  const requirements: string[] = [];

  const sectionPatterns = [
    /(?:requirements?|qualifications?|what you(?:'ll)? need|must have|minimum qualifications?)[:\s]*([\s\S]*?)(?=(?:responsibilities|about|benefits|what we offer|preferred|nice to have|$))/i,
    /(?:preferred|nice to have|bonus)[:\s]*([\s\S]*?)(?=(?:responsibilities|about|benefits|$))/i,
  ];

  for (const pattern of sectionPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const bullets = match[1]
        .split(/\n|•|·|▪|◦|[-–—]\s+/)
        .map((s) => normalizeWhitespace(s))
        .filter((s) => s.length > 10 && s.length < 500);
      requirements.push(...bullets);
    }
  }

  if (requirements.length === 0) {
    const sentences = text
      .split(/[.!?]\s+/)
      .filter(
        (s) =>
          /\b(required|must|need|experience with|proficiency|knowledge of)\b/i.test(
            s
          ) && s.length > 20
      )
      .slice(0, 15);
    requirements.push(...sentences.map(normalizeWhitespace));
  }

  return [...new Set(requirements)].slice(0, 30);
}

export function normalizeJob(input: RawJobInput): Job {
  const description = stripHtml(input.description);
  const requirements =
    input.requirements && input.requirements.length > 0
      ? input.requirements.map(normalizeWhitespace)
      : extractRequirements(description);

  return {
    id: generateJobId(input.company, input.title, input.source_url),
    title: normalizeWhitespace(input.title),
    company: normalizeWhitespace(input.company),
    description,
    requirements,
    location: normalizeWhitespace(input.location ?? "Unknown"),
    employment_type: input.employment_type,
    visa_policy: input.visa_policy,
    experience_level: input.experience_level,
    sponsorship_status: input.sponsorship_status ?? "unknown",
    posting_age: input.posting_age,
    source_url: input.source_url,
    source: input.source,
    scraped_at: new Date().toISOString(),
  };
}

export function normalizeJobs(inputs: RawJobInput[]): Job[] {
  return inputs.map(normalizeJob);
}
