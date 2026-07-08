import type { Constraints, Job } from "../utils/schema_validator.js";

export interface VisaCheckResult {
  passed: boolean;
  signals: string[];
  blockers: string[];
}

const VISA_BLOCKER_PATTERNS: Array<{ pattern: RegExp; signal: string }> = [
  { pattern: /us\s+citizen(?:ship)?\s+(?:only|required)/i, signal: "US citizenship only" },
  { pattern: /must\s+be\s+(?:a\s+)?us\s+citizen/i, signal: "Must be US citizen" },
  { pattern: /no\s+(?:opt|cpt)\b/i, signal: "No OPT/CPT" },
  { pattern: /no\s+visa\s+sponsor/i, signal: "No visa sponsorship" },
  { pattern: /unable\s+to\s+sponsor/i, signal: "Unable to sponsor" },
  { pattern: /will\s+not\s+sponsor/i, signal: "Will not sponsor" },
  { pattern: /security\s+clearance/i, signal: "Security clearance required" },
  { pattern: /\b(ts\/sci|ts\s*\/\s*sci)\b/i, signal: "TS/SCI clearance" },
  { pattern: /\b(ts|sci)\s+clearance/i, signal: "Clearance required" },
  { pattern: /permanent\s+residen/i, signal: "Permanent residency required" },
  { pattern: /green\s+card\s+required/i, signal: "Green card required" },
];

export function detectVisaConstraints(
  job: Job,
  constraints: Constraints
): VisaCheckResult {
  const fullText = `${job.title} ${job.description} ${job.requirements.join(" ")} ${job.visa_policy ?? ""}`;
  const signals: string[] = [];
  const blockers: string[] = [];

  for (const { pattern, signal } of VISA_BLOCKER_PATTERNS) {
    if (pattern.test(fullText)) {
      signals.push(signal);

      if (constraints.visa.requires_sponsorship) {
        if (
          signal.includes("citizen") &&
          constraints.exclude?.citizenship_only !== false
        ) {
          blockers.push(signal);
        }
        if (signal.includes("OPT") || signal.includes("CPT")) {
          blockers.push(signal);
        }
        if (signal.includes("sponsor")) {
          blockers.push(signal);
        }
      }

      const clearanceList = constraints.exclude?.clearance ?? [];
      if (
        signal.toLowerCase().includes("clearance") &&
        clearanceList.some((c) =>
          signal.toLowerCase().includes(c.toLowerCase())
        )
      ) {
        blockers.push(signal);
      }

      if (signal.includes("residency") || signal.includes("Green card")) {
        blockers.push(signal);
      }
    }
  }

  return {
    passed: blockers.length === 0,
    signals,
    blockers,
  };
}

export async function loadConstraintsFromFile(
  content: string
): Promise<Constraints> {
  const { loadConstraints } = await import("../utils/constraints_loader.js");
  return loadConstraints(content);
}
