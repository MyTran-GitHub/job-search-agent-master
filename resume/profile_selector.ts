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

const MASTER_RESUME_MAP: Record<JobFunction, string> = {
  GeospatialEngineering: "Geospatial_Engineer_master-cv.md",
  GISAnalyst: "GIS_master_cv.md",
  GeoAIResearch: "GeoAi_master_cv.md",
  EnvironmentalDS: "Geospatial_Engineer_master-cv.md",
  Other: "Geospatial_Engineer_master-cv.md",
};

export interface ProfileSelection {
  job_function: JobFunction;
  profile_file: string;
  profile_path: string;
  profile_content: string;
  master_resume_file: string;
  master_resume_path: string;
  master_resume_content: string;
}

export async function selectProfile(
  jobFunction: JobFunction
): Promise<ProfileSelection> {
  const profileFile = PROFILE_MAP[jobFunction];
  const profilePath = path.join(PATHS.profiles, profileFile);
  const content = (await readTextFile(profilePath)) ?? "";

  const masterResumeFile = MASTER_RESUME_MAP[jobFunction];
  const masterResumePath = path.join(PATHS.masterResumes, masterResumeFile);
  const masterResumeContent = (await readTextFile(masterResumePath)) ?? "";

  return {
    job_function: jobFunction,
    profile_file: profileFile,
    profile_path: profilePath,
    profile_content: content,
    master_resume_file: masterResumeFile,
    master_resume_path: masterResumePath,
    master_resume_content: masterResumeContent,
  };
}

export function getProfileFileName(jobFunction: JobFunction): string {
  return PROFILE_MAP[jobFunction];
}

export function getMasterResumeFileName(jobFunction: JobFunction): string {
  return MASTER_RESUME_MAP[jobFunction];
}
