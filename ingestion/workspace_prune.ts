import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "../utils/constants.js";
import { logger } from "../utils/logger.js";

export interface PruneResult {
  rankedRemoved: number;
  rejectedRemoved: number;
  normalizedRemoved: number;
}

/**
 * Drop pipeline artifacts whose job IDs are not in the current scrape snapshot.
 */
export async function pruneJobPipeline(
  validJobIds: Set<string>
): Promise<PruneResult> {
  let rankedRemoved = 0;
  let rejectedRemoved = 0;
  let normalizedRemoved = 0;

  try {
    const rankedEntries = await fs.readdir(PATHS.jobsRanked);
    for (const entry of rankedEntries) {
      if (entry.startsWith(".")) continue;
      if (!validJobIds.has(entry)) {
        await fs.rm(path.join(PATHS.jobsRanked, entry), {
          recursive: true,
          force: true,
        });
        rankedRemoved++;
      }
    }
  } catch {
    // directory may not exist yet
  }

  try {
    const rejectedEntries = await fs.readdir(PATHS.jobsRejected);
    for (const entry of rejectedEntries) {
      if (!entry.endsWith(".json")) continue;
      const id = entry.slice(0, -".json".length);
      if (!validJobIds.has(id)) {
        await fs.rm(path.join(PATHS.jobsRejected, entry), { force: true });
        rejectedRemoved++;
      }
    }
  } catch {
    // directory may not exist yet
  }

  try {
    const normalizedEntries = await fs.readdir(PATHS.jobsNormalized);
    for (const entry of normalizedEntries) {
      if (!entry.endsWith(".json")) continue;
      const id = entry.slice(0, -".json".length);
      if (!validJobIds.has(id)) {
        await fs.rm(path.join(PATHS.jobsNormalized, entry), { force: true });
        normalizedRemoved++;
      }
    }
  } catch {
    // directory may not exist yet
  }

  if (rankedRemoved || rejectedRemoved || normalizedRemoved) {
    logger.info(
      `Pruned stale pipeline artifacts: ranked=${rankedRemoved}, rejected=${rejectedRemoved}, normalized=${normalizedRemoved}`
    );
  }

  return { rankedRemoved, rejectedRemoved, normalizedRemoved };
}
