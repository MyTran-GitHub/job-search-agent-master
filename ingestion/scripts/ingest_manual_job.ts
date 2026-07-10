#!/usr/bin/env node
import path from "node:path";
import { PATHS } from "../../utils/constants.js";
import { ensureDir, writeJsonFile } from "../../utils/fs_helpers.js";
import { normalizeJob } from "../normalize_job.js";
import type { RawJobInput } from "../normalize_job.js";

const raw: RawJobInput = JSON.parse(process.argv[2] ?? "{}");

async function main() {
  const job = normalizeJob(raw);
  await ensureDir(PATHS.jobsNormalized);
  const out = path.join(PATHS.jobsNormalized, `${job.id}.json`);
  await writeJsonFile(out, job);
  console.log(job.id);
  console.log(out);
}

main();
