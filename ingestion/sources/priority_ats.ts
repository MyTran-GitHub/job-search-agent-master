import { readTextFile } from "../../utils/fs_helpers.js";
import { PATHS } from "../../utils/constants.js";
import { logger } from "../../utils/logger.js";
import type { RawJobInput } from "../normalize_job.js";
import { fetchGreenhouseJobs } from "./greenhouse.js";
import { fetchLeverJobs } from "./lever.js";
import { fetchAshbyJobs } from "./ashby.js";
import {
  evaluateAtsJob,
  type PrefetchFilterOptions,
} from "../prefetch_filter.js";

export type AtsProvider = "greenhouse" | "lever" | "ashby";

export interface TargetAtsBoard {
  provider: AtsProvider;
  token: string;
  company: string;
}

/**
 * Parse library/context/target_sources.md boards section.
 * Line format: `- greenhouse:token | Company Name`
 */
export function parseTargetSourcesMarkdown(markdown: string): TargetAtsBoard[] {
  const section = markdown.match(/## Boards[\s\S]*?(?=##|$)/i);
  if (!section) return [];

  const boards: TargetAtsBoard[] = [];
  for (const line of section[0].split("\n")) {
    const match = line.match(
      /^-\s+(greenhouse|lever|ashby)\s*:\s*([^\s|]+)\s*\|\s*(.+)$/i
    );
    if (!match) continue;
    boards.push({
      provider: match[1].toLowerCase() as AtsProvider,
      token: match[2].trim(),
      company: match[3].trim(),
    });
  }
  return boards;
}

export async function loadTargetAtsBoards(
  filePath: string = PATHS.targetSources
): Promise<TargetAtsBoard[]> {
  const md = (await readTextFile(filePath)) ?? "";
  return parseTargetSourcesMarkdown(md);
}

async function fetchBoard(board: TargetAtsBoard): Promise<RawJobInput[]> {
  switch (board.provider) {
    case "greenhouse":
      return fetchGreenhouseJobs(board.token, board.company);
    case "lever":
      return fetchLeverJobs(board.token, board.company);
    case "ashby":
      return fetchAshbyJobs(board.token, board.company);
  }
}

/**
 * Pull jobs from configured priority ATS boards and keep domain-relevant postings.
 */
export async function fetchPriorityAtsJobs(options?: {
  boardsPath?: string;
  filterOptions?: PrefetchFilterOptions;
}): Promise<RawJobInput[]> {
  const boards = await loadTargetAtsBoards(options?.boardsPath);
  if (boards.length === 0) {
    logger.info("No target ATS boards configured");
    return [];
  }

  const all: RawJobInput[] = [];

  for (const board of boards) {
    try {
      logger.info(
        `ATS scrape: ${board.provider}:${board.token} (${board.company})`
      );
      const jobs = await fetchBoard(board);
      // Boards are already climate-priority employers — primarily drop clear senior roles;
      // keep domain hits preferentially but do not require ontology keywords on every posting.
      const filterOpts: PrefetchFilterOptions = {
        requireDomainSignal: false,
        dropClearSenior: true,
        ...options?.filterOptions,
      };
      let kept = 0;
      for (const job of jobs) {
        const decision = evaluateAtsJob(job, filterOpts);
        if (decision.keep) {
          all.push(job);
          kept++;
        }
      }
      logger.info(
        `ATS ${board.company}: kept ${kept}/${jobs.length} postings`
      );
    } catch (err) {
      logger.warn(
        `ATS board failed ${board.provider}:${board.token} — skipping`,
        err
      );
    }
  }

  return all;
}
