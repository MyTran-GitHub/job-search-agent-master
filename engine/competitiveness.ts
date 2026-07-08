import type { Job } from "../utils/schema_validator.js";
import type { OptimizationPlan } from "../resume/optimizer.js";
import type { JobFunction } from "../utils/constants.js";
import { classifyRequirements } from "./classify_requirements.js";
import {
  primaryDomainHits,
  scoreDomainAlignment,
} from "../ingestion/domain_signals.js";

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

/**
 * Domain alignment blends job-function taxonomy with climate ontology hits.
 * Climate/EO/sustainability signal elevates general GIS; noise demotes.
 */
export function scoreDomainAlignmentForJob(
  job: Job,
  jobFunction: JobFunction
): number {
  const geoFunctions: JobFunction[] = [
    "GeospatialEngineering",
    "GISAnalyst",
    "GeoAIResearch",
    "EnvironmentalDS",
  ];

  const text = `${job.title} ${job.description} ${job.requirements.join(" ")}`;
  const domain = scoreDomainAlignment(text);
  const primary = primaryDomainHits(domain.hits);
  const storedPrimary = (job.domain_signals ?? []).filter(
    (d) => d !== "geospatial"
  );

  if (primary.length > 0 || storedPrimary.length > 0) {
    let score =
      typeof job.domain_score === "number" && job.domain_score > 0
        ? job.domain_score
        : domain.score;
    if (geoFunctions.includes(jobFunction)) {
      score = Math.max(score, 70);
    }
    return Math.min(100, score);
  }

  // Geo toolkit without climate/EO focus → moderate at best
  if (geoFunctions.includes(jobFunction) || domain.hits.length > 0) {
    return 48;
  }
  return 35;
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

  const domainScore = scoreDomainAlignmentForJob(job, jobFunction);
  const domain_alignment = scoreToLevel(domainScore);

  const role_function_fit =
    jobFunction !== "Other" ? scoreToLevel(75) : scoreToLevel(50);

  const preferredGaps = classifyRequirements(job.requirements).filter(
    (r) => r.classification === "preferred"
  ).length;

  // Stronger senior demotion — title, label, and years
  let seniorityPenalty = 0;
  const titleSenior = /\b(senior|sr\.?|lead|principal|staff|director)\b/i.test(
    job.title
  );
  if (titleSenior) seniorityPenalty += 25;
  if (job.seniority_label === "senior") seniorityPenalty += 20;
  if (job.seniority_label === "mid") seniorityPenalty += 8;
  if (
    job.seniority_label === "unknown" &&
    titleSenior === false &&
    (job.years_required == null || job.years_required <= 2)
  ) {
    // Ambiguous early-ish roles: small boost via negative penalty
    seniorityPenalty -= 5;
  }
  if (job.seniority_label === "entry") {
    seniorityPenalty -= 10;
  }

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
