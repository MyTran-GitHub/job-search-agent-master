import type { Job, DecisionReport } from "../utils/schema_validator.js";
import type { HardFilterResult } from "./hard_filters.js";
import type { EntryLevelCheckResult } from "./detect_entry_level.js";
import type { VisaCheckResult } from "./detect_visa_constraints.js";
import type { CompetitivenessResult } from "./competitiveness.js";
import type { TierResult } from "./tier_engine.js";
import type { JobFunction } from "../utils/constants.js";

export interface DecisionReportInput {
  job: Job;
  job_function: JobFunction;
  selected_master_resume: string;
  hard_filter: HardFilterResult;
  entry_level_check: EntryLevelCheckResult;
  visa_check: VisaCheckResult;
  optimization_summary: string[];
  capability_alignment: { score: number; matched: string[]; missing: string[] };
  competitiveness: CompetitivenessResult;
  tier_result: TierResult;
}

export function buildDecisionReport(
  input: DecisionReportInput
): DecisionReport {
  return {
    job_id: input.job.id,
    title: input.job.title,
    company: input.job.company,
    job_function: input.job_function,
    selected_master_resume: input.selected_master_resume,
    hard_filter: {
      passed: input.hard_filter.passed,
      checks: input.hard_filter.checks,
    },
    entry_level_check: {
      passed: input.entry_level_check.passed,
      reason: input.entry_level_check.reason,
      years_required: input.entry_level_check.years_required,
      is_entry_level_role: input.entry_level_check.is_entry_level_role,
    },
    visa_check: {
      passed: input.visa_check.passed,
      signals: input.visa_check.signals,
    },
    optimization_summary: input.optimization_summary,
    capability_alignment: input.capability_alignment,
    competitiveness: input.competitiveness,
    tier: input.tier_result.tier,
    justification: input.tier_result.justification,
    source_url: input.job.source_url,
    ranked_at: new Date().toISOString(),
  };
}

export function formatDecisionReportTerminal(report: DecisionReport): string {
  const lines: string[] = [
    `\n${"=".repeat(60)}`,
    `[Tier ${report.tier}] ${report.title} @ ${report.company}`,
    `Function: ${report.job_function}`,
    `URL: ${report.source_url}`,
    "",
    "Hard filter:",
    ...report.hard_filter.checks.map(
      (c) => `  ${c.passed ? "✓" : "✗"} ${c.name}: ${c.reason}`
    ),
    "",
    `Entry-level: ${report.entry_level_check.passed ? "PASS" : "FAIL"} — ${report.entry_level_check.reason}`,
    `Visa: ${report.visa_check.passed ? "PASS" : "FAIL"} — ${report.visa_check.signals.join(", ") || "no signals"}`,
    "",
    "Optimization:",
    ...report.optimization_summary.map((s) => `  • ${s}`),
    "",
    "Justification:",
    ...report.justification.map((j) => `  • ${j}`),
    `${"=".repeat(60)}`,
  ];
  return lines.join("\n");
}
