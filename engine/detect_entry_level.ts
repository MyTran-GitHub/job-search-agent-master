import type { Job } from "../utils/schema_validator.js";
import {
  extractYearsFromText,
  isEntryLevelTitle,
} from "../utils/text_normalizer.js";

export interface EntryLevelCheckResult {
  passed: boolean;
  reason: string;
  years_required: number | null;
  is_entry_level_role: boolean;
  max_years_allowed: number;
}

export function detectEntryLevel(
  job: Job,
  maxYearsAllowed = 2
): EntryLevelCheckResult {
  const fullText = `${job.title} ${job.description} ${job.requirements.join(" ")}`;
  const yearsRequired = extractYearsFromText(fullText);
  const isEntryLevel = isEntryLevelTitle(job.title);

  // Entry-level title + requires >3 years → REJECT
  if (isEntryLevel && yearsRequired !== null && yearsRequired > 3) {
    return {
      passed: false,
      reason: `Entry-level title "${job.title}" requires ${yearsRequired}+ years — structural mismatch`,
      years_required: yearsRequired,
      is_entry_level_role: true,
      max_years_allowed: maxYearsAllowed,
    };
  }

  // Non-entry title + requires 3+ years → REJECT for entry-level candidates
  if (!isEntryLevel && yearsRequired !== null && yearsRequired >= 3) {
    return {
      passed: false,
      reason: `Role requires ${yearsRequired}+ years experience — exceeds entry-level ceiling (${maxYearsAllowed})`,
      years_required: yearsRequired,
      is_entry_level_role: false,
      max_years_allowed: maxYearsAllowed,
    };
  }

  // Explicit max years from constraints
  if (yearsRequired !== null && yearsRequired > maxYearsAllowed) {
    return {
      passed: false,
      reason: `Requires ${yearsRequired} years — exceeds candidate ceiling of ${maxYearsAllowed}`,
      years_required: yearsRequired,
      is_entry_level_role: isEntryLevel,
      max_years_allowed: maxYearsAllowed,
    };
  }

  // Accept: 0-1 years, bachelor, ambiguous, entry-level without inflated req
  const acceptReasons: string[] = [];
  if (yearsRequired === null) {
    acceptReasons.push("ambiguous experience requirement — defer to optimization");
  } else if (yearsRequired <= 1) {
    acceptReasons.push(`${yearsRequired} year(s) required — within entry-level range`);
  } else {
    acceptReasons.push(`${yearsRequired} years required — within ceiling`);
  }

  if (/\bbachelor/i.test(fullText)) {
    acceptReasons.push("bachelor's degree mentioned (non-disqualifying)");
  }

  if (isEntryLevel) {
    acceptReasons.push("entry-level title without inflated experience requirement");
  }

  return {
    passed: true,
    reason: acceptReasons.join("; "),
    years_required: yearsRequired,
    is_entry_level_role: isEntryLevel,
    max_years_allowed: maxYearsAllowed,
  };
}
