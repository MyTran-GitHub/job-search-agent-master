import type { Job } from "../utils/schema_validator.js";
import type { OptimizationPlan } from "../resume/optimizer.js";
import type { JobFunction } from "../utils/constants.js";
import { classifyRequirements } from "./classify_requirements.js";

export type CompetitivenessLevel = "strong" | "moderate" | "weak";

export interface CompetitivenessResult {
  technical_match: CompetitivenessLevel;
  evidence_strength: CompetitivenessLevel;
  domain_alignment: CompetitivenessLevel;
  role_function_fit: CompetitivenessLevel;
  market_competitiveness: CompetitivenessLevel;
  preferred_gaps: number;
}

function scoreToLevel(score: number): CompetitivenessLevel {
  if (score >= 70) return "strong";
  if (score >= 45) return "moderate";
  return "weak";
}

export function assessCompetitiveness(
  job: Job,
  jobFunction: JobFunction,
  plan: OptimizationPlan
): CompetitivenessResult {
  const technicalScore = plan.ats_alignment_score;
  const technical_match = scoreToLevel(technicalScore);

  const evidenceCount = plan.bullets_to_promote.length;
  const evidence_strength = scoreToLevel(
    evidenceCount >= 3 ? 75 : evidenceCount >= 2 ? 55 : 35
  );

  const geoFunctions: JobFunction[] = [
    "GeospatialEngineering",
    "GISAnalyst",
    "GeoAIResearch",
    "EnvironmentalDS",
  ];
  const domain_alignment = geoFunctions.includes(jobFunction)
    ? scoreToLevel(70)
    : scoreToLevel(40);

  const role_function_fit =
    jobFunction !== "Other" ? scoreToLevel(75) : scoreToLevel(50);

  const preferredGaps = classifyRequirements(job.requirements).filter(
    (r) => r.classification === "preferred"
  ).length;

  const seniorityPenalty = /\b(senior|lead|principal)\b/i.test(job.title)
    ? 20
    : 0;
  const marketScore = Math.max(
    0,
    technicalScore - preferredGaps * 5 - seniorityPenalty
  );
  const market_competitiveness = scoreToLevel(marketScore);

  return {
    technical_match,
    evidence_strength,
    domain_alignment,
    role_function_fit,
    market_competitiveness,
    preferred_gaps: preferredGaps,
  };
}
