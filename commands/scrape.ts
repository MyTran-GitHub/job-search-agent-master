#!/usr/bin/env node
import { Command } from "commander";
import pLimit from "p-limit";
import path from "node:path";
import { loadConfig } from "../utils/config.js";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  readTextFile,
  writeJsonFile,
  listJsonFiles,
} from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";
import { dedupeJobs } from "../ingestion/dedupe_jobs.js";
import { normalizeJob } from "../ingestion/normalize_job.js";
import {
  parseSearchQueries,
  searchAllQueries,
} from "../ingestion/sources/tinyfish_search.js";
import {
  tinyfishFetch,
  fetchResultToRawJob,
} from "../ingestion/sources/tinyfish_fetch.js";
import type { Job } from "../utils/schema_validator.js";

const program = new Command();

program
  .name("scrape")
  .description("Discover jobs via TinyFish and normalize to canonical schema")
  .option("--mock", "Use fixture data instead of live TinyFish API")
  .option("--query <q>", "Override search query")
  .option("--limit <n>", "Results per query", "15")
  .action(async (opts) => {
    const config = loadConfig();
    await ensureDir(PATHS.jobsRaw);
    await ensureDir(PATHS.jobsNormalized);

    let searchResults: Array<{ url: string; title?: string; company?: string }>;

    if (opts.mock) {
      const fixture = await import(
        "../ingestion/sources/__fixtures__/tinyfish_search_results.json",
        { with: { type: "json" } }
      );
      searchResults = fixture.default;
      logger.info("Using mock search fixtures");
    } else if (opts.query) {
      const { tinyfishSearch } = await import(
        "../ingestion/sources/tinyfish_search.js"
      );
      searchResults = await tinyfishSearch(config, {
        query: opts.query,
        limit: parseInt(opts.limit, 10),
      });
    } else {
      const careerGoals =
        (await readTextFile(PATHS.careerGoals)) ?? "";
      const queries = parseSearchQueries(careerGoals);
      searchResults = await searchAllQueries(
        config,
        queries,
        parseInt(opts.limit, 10)
      );
    }

    logger.info(`Found ${searchResults.length} search results`);

    const limit = pLimit(config.rateLimit.concurrency);
    const jobs: Job[] = [];

    await Promise.all(
      searchResults.map((result) =>
        limit(async () => {
          try {
            let rawJob;
            if (opts.mock) {
              const fixture = await import(
                "../ingestion/sources/__fixtures__/tinyfish_fetch_result.json",
                { with: { type: "json" } }
              );
              const fetchData = {
                ...fixture.default,
                url: result.url,
                title: result.title ?? fixture.default.title,
                company: result.company ?? fixture.default.company,
              };
              rawJob = fetchResultToRawJob(fetchData);
            } else {
              const fetched = await tinyfishFetch(config, result.url);
              await writeJsonFile(
                path.join(PATHS.jobsRaw, `${Buffer.from(result.url).toString("base64url").slice(0, 20)}.json`),
                fetched
              );
              rawJob = fetchResultToRawJob(fetched);
            }

            if (rawJob) {
              const job = normalizeJob(rawJob);
              jobs.push(job);
              await writeJsonFile(
                path.join(PATHS.jobsNormalized, `${job.id}.json`),
                job
              );
            }
          } catch (err) {
            logger.warn(`Failed to fetch ${result.url}`, err);
          }
        })
      )
    );

    const deduped = dedupeJobs(jobs);
    logger.info(
      `Scrape complete: ${deduped.length} normalized jobs (${jobs.length - deduped.length} duplicates removed)`
    );

    for (const job of deduped) {
      await writeJsonFile(
        path.join(PATHS.jobsNormalized, `${job.id}.json`),
        job
      );
    }

    console.log(`\nSaved ${deduped.length} jobs to workspace/jobs/normalized/`);
  });

program.parse();
