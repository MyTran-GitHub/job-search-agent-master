export type RequirementClass = "functional" | "preferred" | "blocking";

export interface ClassifiedRequirement {
  text: string;
  classification: RequirementClass;
  reason: string;
}

const BLOCKING_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /us\s+citizen(?:ship)?\s+(?:only|required)/i, reason: "US citizenship required" },
  { pattern: /must\s+be\s+(?:a\s+)?us\s+citizen/i, reason: "US citizenship required" },
  { pattern: /no\s+(?:opt|cpt|visa)\s+sponsor/i, reason: "No visa sponsorship" },
  { pattern: /unable\s+to\s+sponsor/i, reason: "No visa sponsorship" },
  { pattern: /will\s+not\s+sponsor/i, reason: "No visa sponsorship" },
  { pattern: /security\s+clearance/i, reason: "Security clearance required" },
  { pattern: /\b(ts\/sci|ts\s*\/\s*sci)\b/i, reason: "TS/SCI clearance required" },
  { pattern: /permanent\s+residen/i, reason: "Permanent residency required" },
  { pattern: /active\s+\w+\s+(?:bar|license)/i, reason: "Professional license required" },
  { pattern: /medical\s+license/i, reason: "Medical license required" },
  { pattern: /ph\.?d\.?\s+required/i, reason: "PhD required" },
  { pattern: /professional\s+engineer\s+license/i, reason: "PE license required" },
];

const PREFERRED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /preferred/i, reason: "Preferred qualification" },
  { pattern: /nice\s+to\s+have/i, reason: "Nice-to-have" },
  { pattern: /bonus/i, reason: "Bonus qualification" },
  { pattern: /master'?s?\s+(?:degree\s+)?preferred/i, reason: "Master's preferred" },
  { pattern: /ideally/i, reason: "Ideal qualification" },
];

export function classifyRequirement(text: string): ClassifiedRequirement {
  for (const { pattern, reason } of BLOCKING_PATTERNS) {
    if (pattern.test(text)) {
      return { text, classification: "blocking", reason };
    }
  }

  for (const { pattern, reason } of PREFERRED_PATTERNS) {
    if (pattern.test(text)) {
      return { text, classification: "preferred", reason };
    }
  }

  return {
    text,
    classification: "functional",
    reason: "Rewritable via resume optimization",
  };
}

export function classifyRequirements(
  requirements: string[]
): ClassifiedRequirement[] {
  return requirements.map(classifyRequirement);
}

export function classifyJobText(text: string): ClassifiedRequirement[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10);
  return classifyRequirements(lines);
}
