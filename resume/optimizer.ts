import type { Job } from "../utils/schema_validator.js";
import type { JobFunction } from "../utils/constants.js";
import type { ProfileSelection } from "./profile_selector.js";
import type { AtsAlignmentResult } from "./ats_alignment.js";
import { classifyRequirements } from "../engine/classify_requirements.js";
import { getNormalizedTerms } from "../engine/requirement_normalizer.js";

export interface OptimizationPlan {
  job_id: string;
  profile: string;
  master_resume_template: string;
  job_function: JobFunction;
  section_order: string[];
  bullets_to_promote: string[];
  terminology_swaps: Array<{ from: string; to: string }>;
  keywords_to_mirror: string[];
  ats_alignment_score: number;
  capability_alignment: {
    score: number;
    matched: string[];
    missing: string[];
  };
}

const DEFAULT_SECTION_ORDER: Record<JobFunction, string[]> = {
  GeospatialEngineering: [
    "Technical Skills",
    "Projects",
    "Internships",
    "Research",
    "Education",
    "Achievements",
  ],
  GISAnalyst: [
    "Technical Skills",
    "Internships",
    "Projects",
    "Research",
    "Education",
    "Achievements",
  ],
  GeoAIResearch: [
    "Technical Skills",
    "Research",
    "Projects",
    "Internships",
    "Education",
    "Achievements",
  ],
  EnvironmentalDS: [
    "Technical Skills",
    "Projects",
    "Research",
    "Internships",
    "Education",
    "Achievements",
  ],
  Other: [
    "Technical Skills",
    "Projects",
    "Internships",
    "Research",
    "Education",
    "Achievements",
  ],
};

const BULLET_MAP: Record<JobFunction, string[]> = {
  GeospatialEngineering: [
    "project-postgis-pipeline",
    "project-geoai-wetlands",
    "intern-gis-analyst",
  ],
  GISAnalyst: ["intern-gis-analyst", "project-postgis-pipeline"],
  GeoAIResearch: ["research-geoai-lab", "project-geoai-wetlands"],
  EnvironmentalDS: [
    "project-geoai-wetlands",
    "research-geoai-lab",
    "intern-gis-analyst",
  ],
  Other: ["project-postgis-pipeline", "project-geoai-wetlands"],
};

function extractBulletsFromProfile(profileContent: string): string[] {
  const matches = profileContent.match(/- (\S+)/g);
  if (!matches) return [];
  return matches.map((m) => m.replace("- ", "").trim());
}

function extractTerminologySwaps(
  profileContent: string
): Array<{ from: string; to: string }> {
  const swaps: Array<{ from: string; to: string }> = [];
  const tableRows = profileContent.match(
    /\| Use instead of \| Prefer \|[\s\S]*?(?=\n\n|$)/i
  );
  if (!tableRows) return swaps;

  const lines = tableRows[0].split("\n").slice(2);
  for (const line of lines) {
    const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 2) {
      swaps.push({ from: cols[0], to: cols[1] });
    }
  }
  return swaps;
}

export function buildOptimizationPlan(
  job: Job,
  jobFunction: JobFunction,
  profile: ProfileSelection,
  atsAlignment: AtsAlignmentResult
): OptimizationPlan {
  const profileBullets = extractBulletsFromProfile(profile.profile_content);
  const defaultBullets = BULLET_MAP[jobFunction];
  const bulletsToPromote =
    profileBullets.length > 0 ? profileBullets : defaultBullets;

  const functionalReqs = classifyRequirements(job.requirements)
    .filter((r) => r.classification === "functional")
    .map((r) => r.text);

  const keywordsToMirror = [
    ...getNormalizedTerms(functionalReqs).slice(0, 10),
    ...atsAlignment.matched_keywords,
    job.title.split(" ")[0]?.toLowerCase() ?? "",
  ].filter(Boolean);

  const terminologySwaps = extractTerminologySwaps(profile.profile_content);

  return {
    job_id: job.id,
    profile: profile.profile_file,
    master_resume_template: profile.master_resume_file,
    job_function: jobFunction,
    section_order: DEFAULT_SECTION_ORDER[jobFunction],
    bullets_to_promote: bulletsToPromote,
    terminology_swaps: terminologySwaps,
    keywords_to_mirror: [...new Set(keywordsToMirror)].slice(0, 15),
    ats_alignment_score: atsAlignment.score,
    capability_alignment: {
      score: atsAlignment.score,
      matched: atsAlignment.matched_keywords.slice(0, 25),
      missing: atsAlignment.missing_keywords.slice(0, 25),
    },
  };
}

export function summarizeOptimization(plan: OptimizationPlan): string[] {
  const summary: string[] = [];
  summary.push(`Selected profile: ${plan.profile}`);
  summary.push(`Selected master resume: ${plan.master_resume_template}`);
  summary.push(`Section order: ${plan.section_order.slice(0, 3).join(" → ")}...`);
  summary.push(
    `Promoting bullets: ${plan.bullets_to_promote.slice(0, 3).join(", ")}`
  );
  if (plan.terminology_swaps.length > 0) {
    summary.push(
      `Terminology swap: "${plan.terminology_swaps[0].from}" → "${plan.terminology_swaps[0].to}"`
    );
  }
  summary.push(
    `ATS keyword alignment: ${plan.ats_alignment_score}% (${plan.keywords_to_mirror.length} terms to mirror)`
  );
  if (plan.capability_alignment.missing.length > 0) {
    summary.push(
      `Remaining capability gaps (true gaps only): ${plan.capability_alignment.missing.slice(0, 5).join(", ")}`
    );
  }
  return summary;
}
