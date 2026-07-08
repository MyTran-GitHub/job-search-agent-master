#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  readTextFile,
  writeTextFile,
  readJsonFile,
} from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";
import { slugify } from "../utils/text_normalizer.js";
import type { DecisionReport } from "../utils/schema_validator.js";
import type { Job } from "../utils/schema_validator.js";

const program = new Command();

program
  .name("setup")
  .description("Initialize experience database and profiles from CV")
  .option("--from-master", "Aggregate from existing master-cv.md")
  .action(async (opts) => {
    await ensureDir(PATHS.experience);
    await ensureDir(PATHS.profiles);

    const masterCv = await readTextFile(
      path.join(PATHS.context, "master-cv.md")
    );

    if (opts.fromMaster && masterCv && !masterCv.includes("FILL-ME")) {
      logger.info("master-cv.md found — experience/ files should be curated manually");
      logger.info("Run with agent /setup for full CV parsing into experience/");
    }

    const constraintsExists = await readTextFile(PATHS.constraints);
    if (!constraintsExists) {
      logger.warn("constraints.md missing — copy from template");
    }

    const experienceFiles = [
      "projects.md",
      "internships.md",
      "research.md",
      "skills.md",
      "achievements.md",
    ];

    let filled = 0;
    for (const file of experienceFiles) {
      const content = await readTextFile(path.join(PATHS.experience, file));
      if (content && !content.includes("FILL-ME")) filled++;
    }

    console.log("\n--- Setup Status ---");
    console.log(`Experience files filled: ${filled}/${experienceFiles.length}`);
    console.log(`Profiles: ${(await fs.readdir(PATHS.profiles)).length} files`);
    console.log(`Constraints: ${constraintsExists ? "present" : "missing"}`);
    console.log("\nFor full onboarding, use the agent with skills/setup/SKILL.md");
    console.log("Populate library/context/experience/ as your source of truth.");
  });

program.parse();
