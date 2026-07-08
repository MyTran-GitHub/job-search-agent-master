import path from "node:path";
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
  const files = [
    "projects.md",
    "internships.md",
    "research.md",
    "skills.md",
    "achievements.md",
  ];
  const parts: string[] = [];
  for (const file of files) {
    const content = await readTextFile(
      path.join(PATHS.experience, file)
    );
    if (content) parts.push(content);
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
