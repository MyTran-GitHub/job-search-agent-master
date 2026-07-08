#!/usr/bin/env node
import { Command } from "commander";
import pLimit from "p-limit";
import path from "node:path";
import { loadConfig } from "../utils/config.js";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  writeJsonFile,
} from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";
import { dedupeJobs } from "../ingestion/dedupe_jobs.js";
import { normalizeJob } from "../ingestion/normalize_job.js";
import { planSearchQueries } from "../ingestion/query_planner.js";
import { filterSearchResults } from "../ingestion/prefetch_filter.js";
import { searchAllQueries } from "../ingestion/sources/tinyfish_search.js";
import {
  tinyfishFetch,
  fetchResultToRawJob,
} from "../ingestion/sources/tinyfish_fetch.js";
import { fetchPriorityAtsJobs } from "../ingestion/sources/priority_ats.js";
import type { Job } from "../utils/schema_validator.js";
import type { TinyFishSearchResult } from "../ingestion/sources/tinyfish_search.js";
import type { RawJobInput } from "../ingestion/normalize_job.js";

const program = new Command();

program
  .name("scrape")
  .description("Discover jobs via TinyFish + priority ATS boards and normalize")
  .option("--mock", "Use fixture data instead of live TinyFish API")
  .option("--query <q>", "Override search query (skips query planner)")
  .option("--limit <n>", "Results per query", "15")
  .option("--no-ats", "Skip priority ATS board scraping")
  .option("--no-prefetch-filter", "Disable domain/seniority pre-fetch filter")
  .action(async (opts) => {
    const config = loadConfig();
    await ensureDir(PATHS.jobsRaw);
    await ensureDir(PATHS.jobsNormalized);

    let searchResults: TinyFishSearchResult[] = [];

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
      const plan = await planSearchQueries();
      logger.info(
        `Query plan: ${plan.queries.length} queries ` +
          `(roles=${plan.profile.targetRoles.length}, ` +
          `industries=${plan.profile.targetIndustries.length}, ` +
          `skills=${plan.profile.skills.length})`
      );
      for (const q of plan.queries) {
        logger.info(`  [${q.strategy}] ${q.query}`);
      }
      searchResults = await searchAllQueries(
        config,
        plan.queries.map((q) => q.query),
        parseInt(opts.limit, 10)
      );
    }

    logger.info(`Found ${searchResults.length} raw search results`);

    if (opts.prefetchFilter !== false) {
      const { kept, dropped } = filterSearchResults(searchResults);
      logger.info(
        `Pre-fetch filter: kept ${kept.length}, dropped ${dropped.length}`
      );
      for (const d of dropped.slice(0, 8)) {
        logger.debug(
          `Dropped: ${d.result.title ?? d.result.url} — ${d.reason}`
        );
      }
      searchResults = kept;
    }

    const limit = pLimit(config.rateLimit.concurrency);
    const jobs: Job[] = [];

    await Promise.all(
      searchResults.map((result) =>
        limit(async () => {
          try {
            let rawJob: RawJobInput | null;
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
                path.join(
                  PATHS.jobsRaw,
                  `${Buffer.from(result.url).toString("base64url").slice(0, 20)}.json`
                ),
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

    // Priority ATS boards (Greenhouse / Lever / Ashby)
    if (opts.ats !== false && !opts.mock) {
      try {
        const atsJobs = await fetchPriorityAtsJobs();
        for (const raw of atsJobs) {
          const job = normalizeJob(raw);
          jobs.push(job);
        }
        logger.info(`Priority ATS added ${atsJobs.length} domain-filtered jobs`);
      } catch (err) {
        logger.warn("Priority ATS scrape failed", err);
      }
    } else if (opts.mock) {
      logger.info("Skipping ATS boards in --mock mode");
    }

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
