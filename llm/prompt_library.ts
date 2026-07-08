export const PROMPTS = {
  jobInterpreter:
    "Extract structured requirements from this job description. Return JSON with required, preferred, and blocking arrays.",
  semanticMatcher:
    "Map each job requirement to the closest matching experience bullet from the candidate profile. Do not invent matches.",
  resumeRefiner:
    "Rewrite this resume bullet to mirror JD terminology while preserving factual truth. Do not add experience or inflate years.",
} as const;
