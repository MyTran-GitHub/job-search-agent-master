#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { loadConfig } from "../utils/config.js";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  listJsonFiles,
  readJsonFile,
  readTextFile,
  writeJsonFile,
} from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";
import { validateJob } from "../utils/schema_validator.js";
import { classifyJobFunction } from "../engine/classify_job_function.js";
import { runHardFilters } from "../engine/hard_filters.js";
import { detectEntryLevel } from "../engine/detect_entry_level.js";
import { detectVisaConstraints, loadConstraintsFromFile } from "../engine/detect_visa_constraints.js";
import { assessCompetitiveness } from "../engine/competitiveness.js";
import { classifyTier } from "../engine/tier_engine.js";
import {
  buildDecisionReport,
  formatDecisionReportTerminal,
} from "../engine/decision_report.js";
import { buildResumeForJob } from "../resume/build_resume.js";
import { isScrapeFresh } from "../ingestion/posting_freshness.js";
import type { Tier } from "../utils/constants.js";

const program = new Command();

program
  .name("rank")
  .description("Run full job intelligence pipeline: filter → optimize → tier")
  .option("--tier <tiers>", "Filter output tiers (comma-separated, e.g. S,A)", "")
  .option(
    "--max-scrape-age-days <n>",
    "Skip normalized jobs scraped more than N days ago (default: SCRAPE_MAX_POSTING_AGE_DAYS or 10)"
  )
  .action(async (opts) => {
    const config = loadConfig();
    const maxScrapeAgeDays = opts.maxScrapeAgeDays
      ? parseInt(opts.maxScrapeAgeDays, 10)
      : config.scrape.maxPostingAgeDays;
    await ensureDir(PATHS.jobsRanked);
    await ensureDir(PATHS.jobsRejected);

    const constraintsContent =
      (await readTextFile(PATHS.constraints)) ?? "";
    const constraints = await loadConstraintsFromFile(constraintsContent);
    const maxYears = constraints.experience?.max_years_required ?? 2;

    const jobFiles = await listJsonFiles(PATHS.jobsNormalized);
    if (jobFiles.length === 0) {
      console.log("No normalized jobs found. Run `npm run scrape` first.");
      process.exit(1);
    }

    const tierFilter: Set<Tier> | null = opts.tier
      ? new Set(opts.tier.split(",") as Tier[])
      : null;

    const reports: ReturnType<typeof buildDecisionReport>[] = [];
    let skippedStale = 0;

    for (const file of jobFiles) {
      const raw = await readJsonFile<unknown>(file);
      if (!raw) continue;

      const job = validateJob(raw);

      if (!isScrapeFresh(job.scraped_at, maxScrapeAgeDays)) {
        skippedStale++;
        logger.info(
          `SKIP stale scrape: ${job.title} @ ${job.company} (scraped_at=${job.scraped_at})`
        );
        continue;
      }
      const classification = classifyJobFunction(job);
      const hardFilter = runHardFilters(job, constraints);
      const entryCheck = detectEntryLevel(job, maxYears);
      const visaCheck = detectVisaConstraints(job, constraints);

      if (!hardFilter.passed) {
        const rejectedReport = buildDecisionReport({
          job,
          job_function: classification.job_function,
          selected_master_resume: "n/a (hard filter failed pre-optimization)",
          hard_filter: hardFilter,
          entry_level_check: entryCheck,
          visa_check: visaCheck,
          optimization_summary: ["Skipped — hard filter failed before optimization"],
          capability_alignment: { score: 0, matched: [], missing: [] },
          competitiveness: {
            technical_match: "weak",
            evidence_strength: "weak",
            domain_alignment: "weak",
            role_function_fit: "weak",
            market_competitiveness: "weak",
            preferred_gaps: 0,
          },
          tier_result: {
            tier: "D",
            justification: hardFilter.rejection_reasons.map((r) => r.message),
          },
        });

        await writeJsonFile(
          path.join(PATHS.jobsRejected, `${job.id}.json`),
          { job, report: rejectedReport, reasons: hardFilter.rejection_reasons }
        );
        logger.info(`REJECTED: ${job.title} @ ${job.company}`);
        continue;
      }

      const resumeResult = await buildResumeForJob(job);
      const competitiveness = assessCompetitiveness(
        job,
        classification.job_function,
        resumeResult.plan
      );
      const tierResult = classifyTier(
        competitiveness,
        resumeResult.plan.ats_alignment_score,
        hardFilter.passed
      );

      const report = buildDecisionReport({
        job,
        job_function: classification.job_function,
        selected_master_resume: resumeResult.plan.master_resume_template,
        hard_filter: hardFilter,
        entry_level_check: entryCheck,
        visa_check: visaCheck,
        optimization_summary: resumeResult.optimization_summary,
        capability_alignment: resumeResult.plan.capability_alignment,
        competitiveness,
        tier_result: tierResult,
      });

      if (tierFilter && !tierFilter.has(report.tier)) continue;

      const rankedDir = path.join(PATHS.jobsRanked, job.id);
      await writeJsonFile(path.join(rankedDir, "job.json"), job);
      await writeJsonFile(path.join(rankedDir, "decision-report.json"), report);
      reports.push(report);

      console.log(formatDecisionReportTerminal(report));
    }

    const tierCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const r of reports) tierCounts[r.tier]++;

    console.log("\n--- Rank Summary ---");
    console.log(`Tier S: ${tierCounts.S} | A: ${tierCounts.A} | B: ${tierCounts.B} | C: ${tierCounts.C}`);
    if (skippedStale > 0) {
      console.log(`Skipped stale scrape (>${maxScrapeAgeDays}d): ${skippedStale}`);
    }
    console.log(`Rejected: ${(await listJsonFiles(PATHS.jobsRejected)).length}`);
    console.log(`Ranked: ${reports.length} jobs in workspace/jobs/ranked/`);
  });

program.parse();
