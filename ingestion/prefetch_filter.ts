import type { TinyFishSearchResult } from "./sources/tinyfish_search.js";
import {
  countSenioritySignals,
  hasClimateDomainSignal,
  loadClimateOntology,
  primaryDomainHits,
  scoreDomainAlignment,
  type ClimateOntology,
} from "./domain_signals.js";

export interface PrefetchFilterOptions {
  /** Require at least one climate/EO/sustainability domain hit in title+snippet. */
  requireDomainSignal?: boolean;
  /** Drop results that look clearly senior with no entry signal. */
  dropClearSenior?: boolean;
  ontology?: ClimateOntology;
}

export interface PrefetchDecision {
  keep: boolean;
  reason: string;
  domain_score: number;
}

function resultText(result: TinyFishSearchResult): string {
  return [result.title, result.snippet, result.company, result.url]
    .filter(Boolean)
    .join(" ");
}

export function evaluateSearchResult(
  result: TinyFishSearchResult,
  options: PrefetchFilterOptions = {}
): PrefetchDecision {
  const onto = options.ontology ?? loadClimateOntology();
  const text = resultText(result);
  const domain = scoreDomainAlignment(text, onto);
  const seniority = countSenioritySignals(text, onto);

  const requireDomain = options.requireDomainSignal ?? true;
  const dropSenior = options.dropClearSenior ?? true;

  if (domain.noise_hits.length > 0 && domain.hits.length === 0) {
    return {
      keep: false,
      reason: `noise keywords: ${domain.noise_hits.join(", ")}`,
      domain_score: domain.score,
    };
  }

  const primaryHits = primaryDomainHits(domain.hits, onto);
  if (requireDomain && primaryHits.length === 0) {
    // Pure GIS/geospatial without climate/EO/sustainability = drop (precision)
    return {
      keep: false,
      reason:
        domain.hits.length > 0
          ? "geospatial-only — missing climate/EO/sustainability signal"
          : "no climate/EO/sustainability domain signal in title/snippet",
      domain_score: domain.score,
    };
  }

  if (
    dropSenior &&
    seniority.senior >= 1 &&
    seniority.entry === 0 &&
    /\b(senior|sr\.?|lead|principal|director|staff)\b/i.test(
      result.title ?? ""
    )
  ) {
    return {
      keep: false,
      reason: "senior title without early-career signal",
      domain_score: domain.score,
    };
  }

  return {
    keep: true,
    reason:
      primaryHits.length > 0
        ? `domain: ${primaryHits.map((h) => h.domain).join(", ")}`
        : "passed (domain optional)",
    domain_score: domain.score,
  };
}

export function filterSearchResults(
  results: TinyFishSearchResult[],
  options?: PrefetchFilterOptions
): {
  kept: TinyFishSearchResult[];
  dropped: Array<{ result: TinyFishSearchResult; reason: string }>;
} {
  const kept: TinyFishSearchResult[] = [];
  const dropped: Array<{ result: TinyFishSearchResult; reason: string }> = [];

  for (const result of results) {
    const decision = evaluateSearchResult(result, options);
    if (decision.keep) {
      kept.push(result);
    } else {
      dropped.push({ result, reason: decision.reason });
    }
  }

  // Safety: if filter wiped everything, fall back to unfiltered (avoid empty scrapes)
  if (kept.length === 0 && results.length > 0) {
    return {
      kept: results,
      dropped: [],
    };
  }

  return { kept, dropped };
}

export function textHasDomainSignal(text: string): boolean {
  return hasClimateDomainSignal(text);
}

/** Filter raw ATS jobs (full JD available) with the same domain/seniority rules. */
export function evaluateAtsJob(
  job: { title: string; description: string; company?: string },
  options: PrefetchFilterOptions = {}
): PrefetchDecision {
  return evaluateSearchResult(
    {
      url: "",
      title: job.title,
      company: job.company,
      snippet: job.description.slice(0, 1500),
    },
    {
      ...options,
      // Full JD: require a real domain hit (geo-adjacent-only is weaker here)
      requireDomainSignal: options.requireDomainSignal ?? true,
    }
  );
}
