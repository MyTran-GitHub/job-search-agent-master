#!/usr/bin/env node
import { Command } from "commander";
import { PATHS } from "../utils/constants.js";
import { clearDirectory, ensureDir } from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";

const program = new Command();

program
  .name("reset")
  .description("Clear workspace/jobs pipeline state (not applications)")
  .option("--all", "Also clear ranked and rejected")
  .action(async (opts) => {
    await clearDirectory(PATHS.jobsRaw);
    await clearDirectory(PATHS.jobsNormalized);

    if (opts.all) {
      await clearDirectory(PATHS.jobsRanked);
      await clearDirectory(PATHS.jobsRejected);
      logger.info("Cleared raw, normalized, ranked, and rejected");
    } else {
      logger.info("Cleared raw and normalized only");
    }

    await ensureDir(PATHS.jobsRaw);
    await ensureDir(PATHS.jobsNormalized);
    await ensureDir(PATHS.jobsRanked);
    await ensureDir(PATHS.jobsRejected);

    console.log("Job pipeline reset complete. Applications untouched.");
  });

program.parse();
