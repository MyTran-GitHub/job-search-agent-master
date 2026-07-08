#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  readJsonFile,
  writeTextFile,
  readTextFile,
} from "../utils/fs_helpers.js";
import { slugify } from "../utils/text_normalizer.js";
import type { Job, DecisionReport } from "../utils/schema_validator.js";

const program = new Command();

program
  .name("apply")
  .description("Bridge a ranked job into the application pipeline")
  .argument("<jobId>", "Job ID from workspace/jobs/ranked/")
  .action(async (jobId: string) => {
    const rankedDir = path.join(PATHS.jobsRanked, jobId);
    const job = await readJsonFile<Job>(path.join(rankedDir, "job.json"));
    const report = await readJsonFile<DecisionReport>(
      path.join(rankedDir, "decision-report.json")
    );

    if (!job || !report) {
      console.error(`Job ${jobId} not found in ranked/. Run npm run rank first.`);
      process.exit(1);
    }

    if (report.tier === "D") {
      console.error(`Job is Tier D — hard blockers present. Not recommended for apply.`);
      process.exit(1);
    }

    const folderName = `${slugify(job.company)}-${slugify(job.title)}`;
    const appDir = path.join(PATHS.applications, folderName);
    await ensureDir(appDir);

    const jobMd = `---
company: ${job.company}
role: ${job.title}
location: ${job.location}
posting_url: ${job.source_url}
saved_date: ${new Date().toISOString().slice(0, 10)}
tier: ${report.tier}
job_function: ${report.job_function}
job_id: ${job.id}
---

# ${job.title} @ ${job.company}

## Tier ${report.tier} — Decision Summary

${report.justification.map((j) => `- ${j}`).join("\n")}

## Optimization Plan

${report.optimization_summary.map((s) => `- ${s}`).join("\n")}

---

## Job Description

${job.description}

## Requirements

${job.requirements.map((r) => `- ${r}`).join("\n")}
`;

    await writeTextFile(path.join(appDir, "job.md"), jobMd);
    await writeTextFile(path.join(appDir, "application.md"), jobMd);

  const verdict = {
    tier: report.tier,
    job_function: report.job_function,
    hard_filter_passed: report.hard_filter.passed,
    optimization_summary: report.optimization_summary,
    justification: report.justification,
    plan_path: path.join(rankedDir, "optimized-resume-plan.json"),
  };
  await writeTextFile(
    path.join(appDir, "verdict.json"),
    JSON.stringify(verdict, null, 2)
  );

    await seedTrackerRow(job.company, job.title, report.tier);

    console.log(`\nApplication seeded: workspace/applications/${folderName}/`);
    console.log(`Tier: ${report.tier}`);
    console.log(`\nNext steps (agent skills):`);
    console.log(`  1. skills/cv — tailor resume using optimized-resume-plan.json`);
    if (report.tier === "S") {
      console.log(`  2. skills/company-research — optional for Tier S`);
    } else {
      console.log(`  2. skills/company-research — only if you select this job`);
    }
    console.log(`  3. skills/cover-letter → skills/verifier → skills/doc-export`);
  });

async function seedTrackerRow(
  company: string,
  role: string,
  tier: string
): Promise<void> {
  const trackerPath = PATHS.tracker;
  let tracker = await readTextFile(trackerPath);

  if (!tracker) {
    const example = await readTextFile(
      path.join(PATHS.applications, "tracker.EXAMPLE.md")
    );
    tracker = example ?? "# Application Tracker\n\n## Funnel\n\n| Firm | Role | Stage | Deadline | Next action | Shipped | Updated |\n|------|------|-------|----------|-------------|---------|----------|\n";
  }

  const today = new Date().toISOString().slice(0, 10);
  const row = `| ${company} | ${role} | tailoring | — | run skills/cv (Tier ${tier}) | — | ${today} |`;

  if (!tracker.includes(`| ${company} | ${role} |`)) {
    const funnelMatch = tracker.match(/(\| Firm \| Role \| Stage[\s\S]*?\n)(\|[-| ]+\|)/);
    if (funnelMatch) {
      tracker = tracker.replace(
        funnelMatch[0],
        `${funnelMatch[1]}${row}\n${funnelMatch[2]}`
      );
    } else {
      tracker += `\n${row}\n`;
    }
    await writeTextFile(trackerPath, tracker);
  }
}

program.parse();
