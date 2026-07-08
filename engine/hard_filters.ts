import type { Constraints, Job } from "../utils/schema_validator.js";
import { classifyRequirements } from "./classify_requirements.js";
import { detectEntryLevel } from "./detect_entry_level.js";
import { detectVisaConstraints } from "./detect_visa_constraints.js";

export interface RejectionReason {
  code: string;
  message: string;
}

export interface HardFilterResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; reason: string }>;
  rejection_reasons: RejectionReason[];
}

export function runHardFilters(
  job: Job,
  constraints: Constraints
): HardFilterResult {
  const checks: HardFilterResult["checks"] = [];
  const rejection_reasons: RejectionReason[] = [];

  const maxYears =
    constraints.experience?.max_years_required ?? 2;

  // Visa check
  const visa = detectVisaConstraints(job, constraints);
  checks.push({
    name: "visa_sponsorship",
    passed: visa.passed,
    reason: visa.passed
      ? visa.signals.length > 0
        ? `Signals found but not blocking: ${visa.signals.join(", ")}`
        : "No visa blockers detected"
      : `Blocked: ${visa.blockers.join(", ")}`,
  });
  if (!visa.passed) {
    for (const b of visa.blockers) {
      rejection_reasons.push({ code: "VISA_BLOCKER", message: b });
    }
  }

  // Entry-level check
  const entry = detectEntryLevel(job, maxYears);
  checks.push({
    name: "entry_level_experience",
    passed: entry.passed,
    reason: entry.reason,
  });
  if (!entry.passed) {
    rejection_reasons.push({
      code: "EXPERIENCE_MISMATCH",
      message: entry.reason,
    });
  }

  // Structural impossibility — blocking requirements
  const classified = classifyRequirements(job.requirements);
  const blockingReqs = classified.filter((r) => r.classification === "blocking");
  const structuralPassed = blockingReqs.length === 0;
  checks.push({
    name: "structural_requirements",
    passed: structuralPassed,
    reason: structuralPassed
      ? "No legally enforced or license blockers in requirements"
      : `Blocking requirements: ${blockingReqs.map((r) => r.reason).join("; ")}`,
  });
  for (const req of blockingReqs) {
    rejection_reasons.push({
      code: "STRUCTURAL_BLOCKER",
      message: req.reason,
    });
  }

  // Also scan full description for blockers not in requirements array
  const fullText = job.description;
  const descBlockers: string[] = [];
  if (/medical\s+license/i.test(fullText)) {
    descBlockers.push("Medical license required");
  }
  if (/active\s+\w+\s+bar/i.test(fullText)) {
    descBlockers.push("Legal bar license required");
  }
  if (descBlockers.length > 0) {
    checks.push({
      name: "license_requirements",
      passed: false,
      reason: descBlockers.join("; "),
    });
    for (const b of descBlockers) {
      rejection_reasons.push({ code: "LICENSE_BLOCKER", message: b });
    }
  } else if (!checks.find((c) => c.name === "license_requirements")) {
    checks.push({
      name: "license_requirements",
      passed: true,
      reason: "No medical/legal license requirements",
    });
  }

  const passed = rejection_reasons.length === 0;

  return { passed, checks, rejection_reasons };
}
