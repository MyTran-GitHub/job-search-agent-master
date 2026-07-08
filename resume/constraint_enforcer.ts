import type { OptimizationPlan } from "./optimizer.js";

export interface ConstraintViolation {
  field: string;
  message: string;
}

const FABRICATION_PATTERNS = [
  { pattern: /senior\s+(?:engineer|analyst)/i, field: "title", message: "Cannot inflate to senior title" },
  { pattern: /\b(10|15|20)\+?\s*years?\b/i, field: "experience", message: "Cannot claim inflated years of experience" },
  { pattern: /\bph\.?d\.?\b/i, field: "credential", message: "Cannot claim PhD without evidence" },
];

export function validateOptimizationPlan(
  plan: OptimizationPlan,
  experienceText: string
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (const { pattern, field, message } of FABRICATION_PATTERNS) {
    for (const keyword of plan.keywords_to_mirror) {
      if (pattern.test(keyword) && !pattern.test(experienceText)) {
        violations.push({ field, message: `${message}: "${keyword}"` });
      }
    }
  }

  return violations;
}

export function enforceTruthfulness(
  plan: OptimizationPlan,
  experienceText: string
): OptimizationPlan {
  const violations = validateOptimizationPlan(plan, experienceText);
  if (violations.length === 0) return plan;

  const blockedTerms = new Set(
    violations.map((v) => v.message.split(": ")[1]?.replace(/"/g, ""))
  );

  return {
    ...plan,
    keywords_to_mirror: plan.keywords_to_mirror.filter(
      (k) => !blockedTerms.has(k)
    ),
  };
}
