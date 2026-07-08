import type { Job } from "../utils/schema_validator.js";

export interface InterpretedRequirements {
  required: string[];
  preferred: string[];
  blocking: string[];
}

export async function interpretJob(
  _job: Job
): Promise<InterpretedRequirements | null> {
  // No-op default — engine uses deterministic parsing
  return null;
}
