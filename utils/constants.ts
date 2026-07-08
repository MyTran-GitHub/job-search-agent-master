import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");

export const PATHS = {
  library: path.join(ROOT_DIR, "library"),
  context: path.join(ROOT_DIR, "library", "context"),
  experience: path.join(ROOT_DIR, "library", "context", "experience"),
  profiles: path.join(ROOT_DIR, "library", "profiles"),
  constraints: path.join(ROOT_DIR, "library", "context", "constraints.md"),
  careerGoals: path.join(ROOT_DIR, "library", "context", "career_goals.md"),
  skills: path.join(ROOT_DIR, "library", "context", "experience", "skills.md"),
  targetSources: path.join(ROOT_DIR, "library", "context", "target_sources.md"),
  climateOntology: path.join(
    ROOT_DIR,
    "library",
    "domain",
    "climate_ontology.json"
  ),
  jobTaxonomy: path.join(ROOT_DIR, "library", "job_taxonomy.md"),
  workspace: path.join(ROOT_DIR, "workspace"),
  jobs: path.join(ROOT_DIR, "workspace", "jobs"),
  jobsRaw: path.join(ROOT_DIR, "workspace", "jobs", "raw"),
  jobsNormalized: path.join(ROOT_DIR, "workspace", "jobs", "normalized"),
  jobsRanked: path.join(ROOT_DIR, "workspace", "jobs", "ranked"),
  jobsRejected: path.join(ROOT_DIR, "workspace", "jobs", "rejected"),
  applications: path.join(ROOT_DIR, "workspace", "applications"),
  tracker: path.join(ROOT_DIR, "workspace", "applications", "tracker.md"),
} as const;

export const JOB_FUNCTIONS = [
  "GeospatialEngineering",
  "GISAnalyst",
  "GeoAIResearch",
  "EnvironmentalDS",
  "Other",
] as const;

export type JobFunction = (typeof JOB_FUNCTIONS)[number];

export const TIERS = ["S", "A", "B", "C", "D"] as const;
export type Tier = (typeof TIERS)[number];

export const JOB_SOURCES = [
  "tinyfish",
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "manual",
] as const;

export type JobSource = (typeof JOB_SOURCES)[number];
