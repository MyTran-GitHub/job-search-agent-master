#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  readJsonFile,
  readTextFile,
  writeTextFile,
} from "../utils/fs_helpers.js";
import type { DecisionReport } from "../utils/schema_validator.js";
import { classifyRequirements } from "../engine/classify_requirements.js";

const program = new Command();

program
  .name("upskill")
  .description("Identify skill gaps from ranked Tier B/C jobs")
  .option("--job-id <id>", "Analyze a single ranked job")
  .action(async (opts) => {
    const skillsContent =
      (await readTextFile(path.join(PATHS.experience, "skills.md"))) ?? "";
    const skillTerms = extractSkillTerms(skillsContent);

    const reports: DecisionReport[] = [];

    if (opts.jobId) {
      const report = await readJsonFile<DecisionReport>(
        path.join(PATHS.jobsRanked, opts.jobId, "decision-report.json")
      );
      if (report) reports.push(report);
    } else {
      const rankedDirs = await fs.readdir(PATHS.jobsRanked).catch(() => []);
      for (const dir of rankedDirs) {
        const report = await readJsonFile<DecisionReport>(
          path.join(PATHS.jobsRanked, dir, "decision-report.json")
        );
        if (report && (report.tier === "B" || report.tier === "C")) {
          reports.push(report);
        }
      }
    }

    if (reports.length === 0) {
      console.log("No Tier B/C ranked jobs found. Run npm run rank first.");
      return;
    }

    const gapMap = new Map<string, { count: number; jobs: string[] }>();

    for (const report of reports) {
      const job = await readJsonFile<{ requirements: string[] }>(
        path.join(PATHS.jobsRanked, report.job_id, "job.json")
      );
      if (!job) continue;

      for (const req of job.requirements) {
        const classified = classifyRequirements([req])[0];
        if (classified.classification === "blocking") continue;

        const terms = req
          .toLowerCase()
          .match(/\b(python|postgis|gdal|arcgis|aws|pytorch|kubernetes|sql|ml|gis|remote sensing|qgis|gcp|docker|ci\/cd)\b/gi);

        if (!terms) continue;

        for (const term of terms) {
          const lower = term.toLowerCase();
          if (skillTerms.has(lower)) continue;

          const existing = gapMap.get(lower) ?? { count: 0, jobs: [] };
          existing.count++;
          existing.jobs.push(`${report.company} — ${report.title}`);
          gapMap.set(lower, existing);
        }
      }
    }

    const sorted = [...gapMap.entries()].sort((a, b) => b[1].count - a[1].count);
    const today = new Date().toISOString().slice(0, 10);

    let reportMd = `# Upskill Report — ${today}\n\n`;
    reportMd += `**Mode:** ${opts.jobId ? "Targeted" : "Aggregate"} (${reports.length} jobs)\n\n`;
    reportMd += `## Gap Heatmap\n\n`;
    reportMd += `| Priority | Skill | Jobs |\n|----------|-------|------|\n`;

    for (const [skill, data] of sorted.slice(0, 15)) {
      const priority =
        data.count >= 3 ? "Critical" : data.count >= 2 ? "High" : "Medium";
      reportMd += `| ${priority} | ${skill} | ${data.count} |\n`;
    }

    reportMd += `\n## Details\n\n`;
    for (const [skill, data] of sorted.slice(0, 10)) {
      reportMd += `### ${skill}\n`;
      reportMd += `Appears in: ${[...new Set(data.jobs)].slice(0, 3).join("; ")}\n\n`;
    }

    const upskillDir = path.join(PATHS.workspace, "upskill");
    await ensureDir(upskillDir);
    const reportPath = path.join(upskillDir, `report-${today}.md`);
    await writeTextFile(reportPath, reportMd);

    console.log(reportMd);
    console.log(`\nReport saved to ${reportPath}`);
  });

function extractSkillTerms(skillsMarkdown: string): Set<string> {
  const terms = new Set<string>();
  const matches = skillsMarkdown.match(
    /\b(python|sql|javascript|postgis|gdal|arcgis|qgis|pytorch|tensorflow|aws|gcp|docker|kubernetes|gis|ml|scikit-learn|geopandas|rasterio)\b/gi
  );
  if (matches) {
    for (const m of matches) terms.add(m.toLowerCase());
  }
  return terms;
}

program.parse();
