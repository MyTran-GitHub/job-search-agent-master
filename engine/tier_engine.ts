import type { Tier } from "../utils/constants.js";
import type { CompetitivenessResult } from "./competitiveness.js";

export interface TierResult {
  tier: Tier;
  justification: string[];
}

function countStrongDims(c: CompetitivenessResult): number {
  const dims = [
    c.technical_match,
    c.evidence_strength,
    c.domain_alignment,
    c.role_function_fit,
    c.market_competitiveness,
  ];
  return dims.filter((d) => d === "strong").length;
}

function countWeakDims(c: CompetitivenessResult): number {
  const dims = [
    c.technical_match,
    c.evidence_strength,
    c.domain_alignment,
    c.role_function_fit,
    c.market_competitiveness,
  ];
  return dims.filter((d) => d === "weak").length;
}

export function classifyTier(
  competitiveness: CompetitivenessResult,
  atsScore: number,
  hardFilterPassed: boolean
): TierResult {
  if (!hardFilterPassed) {
    return {
      tier: "D",
      justification: [
        "Hard filter failure — role has non-negotiable blockers",
        "Visa, experience, or structural requirements disqualify this role",
        "Do not invest application time unless constraints change",
      ],
    };
  }

  const strongCount = countStrongDims(competitiveness);
  const weakCount = countWeakDims(competitiveness);

  if (strongCount >= 4 && atsScore >= 70) {
    return {
      tier: "S",
      justification: [
        `Strong post-optimization alignment (ATS ${atsScore}%)`,
        `Technical match: ${competitiveness.technical_match}`,
        `Evidence strength: ${competitiveness.evidence_strength}`,
        `Role function fit: ${competitiveness.role_function_fit}`,
        "High probability of interview after tailored application",
      ],
    };
  }

  if (strongCount >= 3 && atsScore >= 55) {
    const justifications = [
      `Strong alignment after optimization (ATS ${atsScore}%)`,
      `Technical match: ${competitiveness.technical_match}`,
      `Domain alignment: ${competitiveness.domain_alignment}`,
    ];
    if (competitiveness.preferred_gaps > 0) {
      justifications.push(
        `${competitiveness.preferred_gaps} preferred gap(s) — minor, not blocking`
      );
    }
    justifications.push("Worth applying with tailored resume");
    return { tier: "A", justification: justifications };
  }

  if (strongCount >= 2 || atsScore >= 45) {
    return {
      tier: "B",
      justification: [
        `Decent alignment (ATS ${atsScore}%) but hiring uncertainty`,
        `Market competitiveness: ${competitiveness.market_competitiveness}`,
        weakCount > 0
          ? `${weakCount} dimension(s) rated weak post-optimization`
          : "Mixed signals across competitiveness dimensions",
        "Conditional apply — prioritize Tier S/A first",
      ],
    };
  }

  if (atsScore >= 30) {
    return {
      tier: "C",
      justification: [
        `Technically possible but weak expected outcome (ATS ${atsScore}%)`,
        `Technical match: ${competitiveness.technical_match}`,
        `Preferred gaps: ${competitiveness.preferred_gaps}`,
        "Low ROI relative to application time",
      ],
    };
  }

  return {
    tier: "D",
    justification: [
      "Structurally misaligned after optimization",
      `ATS alignment ${atsScore}% — insufficient keyword/evidence coverage`,
      `Weak dimensions: ${weakCount}`,
      "Reject unless profile gains new relevant experience",
    ],
  };
}
