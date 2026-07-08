import path from "node:path";
import type { JobFunction } from "../utils/constants.js";
import { PATHS } from "../utils/constants.js";
import { readTextFile } from "../utils/fs_helpers.js";

const PROFILE_MAP: Record<JobFunction, string> = {
  GeospatialEngineering: "geospatial_engineer.md",
  GISAnalyst: "gis_analyst.md",
  GeoAIResearch: "geoai_researcher.md",
  EnvironmentalDS: "environmental_ds.md",
  Other: "software_engineer.md",
};

export interface ProfileSelection {
  job_function: JobFunction;
  profile_file: string;
  profile_path: string;
  profile_content: string;
}

export async function selectProfile(
  jobFunction: JobFunction
): Promise<ProfileSelection> {
  const profileFile = PROFILE_MAP[jobFunction];
  const profilePath = path.join(PATHS.profiles, profileFile);
  const content = (await readTextFile(profilePath)) ?? "";

  return {
    job_function: jobFunction,
    profile_file: profileFile,
    profile_path: profilePath,
    profile_content: content,
  };
}

export function getProfileFileName(jobFunction: JobFunction): string {
  return PROFILE_MAP[jobFunction];
}
