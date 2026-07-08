import { z } from "zod";
import { JOB_FUNCTIONS, JOB_SOURCES, TIERS } from "./constants.js";

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  location: z.string(),
  employment_type: z.string().optional(),
  visa_policy: z.string().optional(),
  experience_level: z.string().optional(),
  sponsorship_status: z.enum(["likely", "unlikely", "unknown"]).optional(),
  posting_age: z.string().optional(),
  source_url: z.string(),
  source: z.enum(JOB_SOURCES),
  scraped_at: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

export const ConstraintsSchema = z.object({
  visa: z.object({
    requires_sponsorship: z.boolean(),
    authorized: z.array(z.string()).optional(),
  }),
  location: z.array(z.string()).optional(),
  exclude: z
    .object({
      clearance: z.array(z.string()).optional(),
      citizenship_only: z.boolean().optional(),
    })
    .optional(),
  experience: z
    .object({
      max_years_required: z.number().optional(),
    })
    .optional(),
});

export type Constraints = z.infer<typeof ConstraintsSchema>;

export const OptimizationPlanSchema = z.object({
  job_id: z.string(),
  profile: z.string(),
  job_function: z.enum(JOB_FUNCTIONS),
  section_order: z.array(z.string()),
  bullets_to_promote: z.array(z.string()),
  terminology_swaps: z.array(
    z.object({ from: z.string(), to: z.string() })
  ),
  keywords_to_mirror: z.array(z.string()),
  ats_alignment_score: z.number(),
});

export type OptimizationPlan = z.infer<typeof OptimizationPlanSchema>;

export const DecisionReportSchema = z.object({
  job_id: z.string(),
  title: z.string(),
  company: z.string(),
  job_function: z.enum(JOB_FUNCTIONS),
  hard_filter: z.object({
    passed: z.boolean(),
    checks: z.array(
      z.object({
        name: z.string(),
        passed: z.boolean(),
        reason: z.string(),
      })
    ),
  }),
  entry_level_check: z.object({
    passed: z.boolean(),
    reason: z.string(),
    years_required: z.number().nullable().optional(),
    is_entry_level_role: z.boolean(),
  }),
  visa_check: z.object({
    passed: z.boolean(),
    signals: z.array(z.string()),
  }),
  optimization_summary: z.array(z.string()),
  competitiveness: z.object({
    technical_match: z.enum(["strong", "moderate", "weak"]),
    evidence_strength: z.enum(["strong", "moderate", "weak"]),
    domain_alignment: z.enum(["strong", "moderate", "weak"]),
    role_function_fit: z.enum(["strong", "moderate", "weak"]),
    market_competitiveness: z.enum(["strong", "moderate", "weak"]),
    preferred_gaps: z.number(),
  }),
  tier: z.enum(TIERS),
  justification: z.array(z.string()),
  source_url: z.string(),
  ranked_at: z.string(),
});

export type DecisionReport = z.infer<typeof DecisionReportSchema>;

export function validateJob(data: unknown): Job {
  return JobSchema.parse(data);
}

export function validateDecisionReport(data: unknown): DecisionReport {
  return DecisionReportSchema.parse(data);
}
