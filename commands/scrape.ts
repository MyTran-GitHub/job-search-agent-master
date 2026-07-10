#!/usr/bin/env node
import { Command } from "commander";
import pLimit from "p-limit";
import path from "node:path";
import { loadConfig } from "../utils/config.js";
import { PATHS } from "../utils/constants.js";
import {
  ensureDir,
  clearDirectory,
  writeJsonFile,
} from "../utils/fs_helpers.js";
import { logger } from "../utils/logger.js";
import { dedupeJobs } from "../ingestion/dedupe_jobs.js";
import { normalizeJob } from "../ingestion/normalize_job.js";
import {
  daysToRecencyMinutes,
  isFreshPosting,
} from "../ingestion/posting_freshness.js";
import { planSearchQueries } from "../ingestion/query_planner.js";
import { filterSearchResults } from "../ingestion/prefetch_filter.js";
import { searchAllQueries } from "../ingestion/sources/tinyfish_search.js";
import {
  tinyfishFetch,
  fetchResultToRawJob,
} from "../ingestion/sources/tinyfish_fetch.js";
import { fetchPriorityAtsJobs } from "../ingestion/sources/priority_ats.js";
import { pruneJobPipeline } from "../ingestion/workspace_prune.js";
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
  .option("--ats-only", "Scrape curated ATS boards only (skip TinyFish)")
  .option("--no-prefetch-filter", "Disable domain/seniority pre-fetch filter")
  .option(
    "--max-age-days <n>",
    "Keep jobs posted within this many days (default: SCRAPE_MAX_POSTING_AGE_DAYS or 10)"
  )
  .option("--no-age-filter", "Disable posting-age filter (include undated/stale jobs)")
  .action(async (opts) => {
    const config = loadConfig();
    const maxAgeDays = opts.maxAgeDays
      ? parseInt(opts.maxAgeDays, 10)
      : config.scrape.maxPostingAgeDays;
    const ageFilter = opts.ageFilter !== false;
    await ensureDir(PATHS.jobsRanked);
    await ensureDir(PATHS.jobsRejected);
    await clearDirectory(PATHS.jobsRaw);
    await clearDirectory(PATHS.jobsNormalized);
    logger.info("Cleared jobs/raw and jobs/normalized for fresh scrape snapshot");

    let searchResults: TinyFishSearchResult[] = [];

    if (opts.atsOnly) {
      logger.info("ATS-only mode — skipping TinyFish search");
    } else if (opts.mock) {
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
        recencyMinutes: daysToRecencyMinutes(maxAgeDays),
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
        parseInt(opts.limit, 10),
        daysToRecencyMinutes(maxAgeDays)
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

    const maybeAddJob = async (rawJob: RawJobInput | null) => {
      if (!rawJob) return;

      if (ageFilter) {
        const decision = isFreshPosting(rawJob, maxAgeDays);
        if (!decision.fresh) {
          logger.debug(
            `Dropped stale: ${rawJob.title} @ ${rawJob.company} — ${decision.reason}`
          );
          return;
        }
      }

      const job = normalizeJob(rawJob);
      jobs.push(job);
    };

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
              rawJob = fetchResultToRawJob(fetchData, {
                company: result.company,
                posting_age:
                  result.date ?? new Date().toISOString(),
              });
            } else {
              const fetched = await tinyfishFetch(config, result.url);
              await writeJsonFile(
                path.join(
                  PATHS.jobsRaw,
                  `${Buffer.from(result.url).toString("base64url").slice(0, 20)}.json`
                ),
                fetched
              );
              rawJob = fetchResultToRawJob(fetched, {
                company: result.company,
                posting_age: result.date,
              });
            }

            await maybeAddJob(rawJob);
          } catch (err) {
            logger.warn(`Failed to fetch ${result.url}`, err);
          }
        })
      )
    );

    // Priority ATS boards (Greenhouse / Lever / Ashby)
    if (opts.ats !== false && (!opts.mock || opts.atsOnly)) {
      try {
        const atsJobs = await fetchPriorityAtsJobs();
        let atsDropped = 0;
        for (const raw of atsJobs) {
          if (ageFilter) {
            const decision = isFreshPosting(raw, maxAgeDays);
            if (!decision.fresh) {
              atsDropped++;
              logger.debug(
                `Dropped stale ATS: ${raw.title} @ ${raw.company} — ${decision.reason}`
              );
              continue;
            }
          }
          await maybeAddJob(raw);
        }
        logger.info(
          `Priority ATS added ${atsJobs.length - atsDropped}/${atsJobs.length} fresh jobs`
        );
      } catch (err) {
        logger.warn("Priority ATS scrape failed", err);
      }
    } else if (opts.mock && !opts.atsOnly) {
      logger.info("Skipping ATS boards in --mock mode");
    }

    const deduped = dedupeJobs(jobs);
    if (ageFilter) {
      logger.info(
        `Posting age filter: ≤${maxAgeDays} days (TinyFish search recency: ${daysToRecencyMinutes(maxAgeDays)} min)`
      );
    }
    logger.info(
      `Scrape complete: ${deduped.length} normalized jobs (${jobs.length - deduped.length} duplicates removed)`
    );

    for (const job of deduped) {
      await writeJsonFile(
        path.join(PATHS.jobsNormalized, `${job.id}.json`),
        job
      );
    }

    const validIds = new Set(deduped.map((j) => j.id));
    await pruneJobPipeline(validIds);

    console.log(`\nSaved ${deduped.length} jobs to workspace/jobs/normalized/`);
  });

program.parse();
