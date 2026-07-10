import path from "node:path";
import fs from "node:fs/promises";
import type { Job } from "../utils/schema_validator.js";
import { PATHS } from "../utils/constants.js";
import { readTextFile, writeJsonFile } from "../utils/fs_helpers.js";
import { classifyJobFunction } from "../engine/classify_job_function.js";
import { computeAtsAlignment } from "./ats_alignment.js";
import { enforceTruthfulness } from "./constraint_enforcer.js";
import {
  buildOptimizationPlan,
  summarizeOptimization,
} from "./optimizer.js";
import { selectProfile } from "./profile_selector.js";

export interface BuildResumeResult {
  plan: ReturnType<typeof buildOptimizationPlan>;
  optimization_summary: string[];
  plan_path: string;
}

async function loadExperienceText(): Promise<string> {
  // Ground truth: load ALL markdown under library/context/experience/.
  // This includes master portfolio evidence files (e.g. master_portfolio_*.md).
  const entries = await fs.readdir(PATHS.experience);
  const mdFiles = entries
    .filter((f) => f.toLowerCase().endsWith(".md"))
    // Prefer canonical summaries first; portfolios later still count for capability evidence.
    .sort((a, b) => {
      const rank = (name: string) => {
        const lower = name.toLowerCase();
        if (lower === "skills.md") return 0;
        if (lower === "projects.md") return 1;
        if (lower === "internships.md") return 2;
        if (lower === "research.md") return 3;
        if (lower === "achievements.md") return 4;
        if (lower.startsWith("master_portfolio_")) return 9;
        return 5;
      };
      return rank(a) - rank(b) || a.localeCompare(b);
    });

  const parts: string[] = [];
  for (const file of mdFiles) {
    const content = await readTextFile(path.join(PATHS.experience, file));
    if (content) parts.push(`\n\n---\n# experience/${file}\n\n${content}`);
  }
  return parts.join("\n");
}

export async function buildResumeForJob(
  job: Job
): Promise<BuildResumeResult> {
  const classification = classifyJobFunction(job);
  const profile = await selectProfile(classification.job_function);
  const experienceText = await loadExperienceText();
  const atsAlignment = computeAtsAlignment(job, experienceText);

  let plan = buildOptimizationPlan(
    job,
    classification.job_function,
    profile,
    atsAlignment
  );
  plan = enforceTruthfulness(plan, experienceText);

  const planPath = path.join(
    PATHS.jobsRanked,
    job.id,
    "optimized-resume-plan.json"
  );
  await writeJsonFile(planPath, plan);

  return {
    plan,
    optimization_summary: summarizeOptimization(plan),
    plan_path: planPath,
  };
}
