import fs from "node:fs";
import { PATHS } from "../utils/constants.js";

export interface DomainSignalHit {
  domain: string;
  label: string;
  matched_keywords: string[];
}

export interface DomainScore {
  score: number;
  hits: DomainSignalHit[];
  noise_hits: string[];
}

export interface ClimateOntology {
  version: number;
  domains: Record<
    string,
    {
      label: string;
      keywords: string[];
      /** supporting = GIS toolkit only; not enough alone for climate focus */
      priority?: "primary" | "supporting";
    }
  >;
  role_family_cues: Record<string, string[]>;
  skill_query_seeds: string[];
  noise_keywords: string[];
  seniority: {
    entry_positive: string[];
    senior_negative: string[];
  };
}

let cached: ClimateOntology | null = null;

export function loadClimateOntology(
  filePath: string = PATHS.climateOntology
): ClimateOntology {
  if (cached) return cached;
  const raw = fs.readFileSync(filePath, "utf-8");
  cached = JSON.parse(raw) as ClimateOntology;
  return cached;
}

/** Reset cache (tests / hot reload). */
export function clearOntologyCache(): void {
  cached = null;
}

/** Domains that count as climate/EO/sustainability focus (not generic GIS alone). */
export function primaryDomainHits(
  hits: DomainSignalHit[],
  ontology?: ClimateOntology
): DomainSignalHit[] {
  const onto = ontology ?? loadClimateOntology();
  return hits.filter((h) => {
    const def = onto.domains[h.domain];
    return def?.priority !== "supporting";
  });
}

export function allDomainKeywords(ontology?: ClimateOntology): string[] {
  const onto = ontology ?? loadClimateOntology();
  return Object.values(onto.domains).flatMap((d) => d.keywords);
}

export function scoreDomainAlignment(
  text: string,
  ontology?: ClimateOntology
): DomainScore {
  const onto = ontology ?? loadClimateOntology();
  const lower = text.toLowerCase();
  const hits: DomainSignalHit[] = [];

  for (const [domain, def] of Object.entries(onto.domains)) {
    const matched = def.keywords.filter((kw) =>
      lower.includes(kw.toLowerCase())
    );
    if (matched.length > 0) {
      hits.push({
        domain,
        label: def.label,
        matched_keywords: matched,
      });
    }
  }

  const noise_hits = onto.noise_keywords.filter((kw) =>
    lower.includes(kw.toLowerCase())
  );

  // Up to ~10 points per domain cluster; primary domains weigh more than supporting GIS
  const raw = hits.reduce((sum, h) => {
    const supporting = onto.domains[h.domain]?.priority === "supporting";
    const weight = supporting ? 1.5 : 3;
    return sum + Math.min(10, h.matched_keywords.length * weight);
  }, 0);
  const score = Math.max(0, Math.min(100, raw * 4 - noise_hits.length * 15));

  return { score, hits, noise_hits };
}

export function hasClimateDomainSignal(
  text: string,
  ontology?: ClimateOntology
): boolean {
  const scored = scoreDomainAlignment(text, ontology);
  return primaryDomainHits(scored.hits, ontology).length > 0;
}

export function countSenioritySignals(
  text: string,
  ontology?: ClimateOntology
): { entry: number; senior: number } {
  const onto = ontology ?? loadClimateOntology();
  const lower = text.toLowerCase();
  const entry = onto.seniority.entry_positive.filter((s) =>
    lower.includes(s.toLowerCase())
  ).length;
  const senior = onto.seniority.senior_negative.filter((s) =>
    lower.includes(s.toLowerCase())
  ).length;
  return { entry, senior };
}

export type SeniorityLabel =
  | "entry"
  | "mid"
  | "senior"
  | "unknown";

export function inferSeniorityLabel(
  title: string,
  description: string,
  yearsRequired: number | null,
  ontology?: ClimateOntology
): SeniorityLabel {
  const onto = ontology ?? loadClimateOntology();
  const titleLower = title.toLowerCase();
  const blob = `${title} ${description}`.toLowerCase();

  const titleSenior = onto.seniority.senior_negative.some((s) =>
    titleLower.includes(s.toLowerCase().trim())
  );
  const titleEntry = onto.seniority.entry_positive.some((s) =>
    titleLower.includes(s.toLowerCase().trim())
  );

  if (titleSenior && !titleEntry) return "senior";
  if (titleEntry) return "entry";

  if (yearsRequired !== null) {
    if (yearsRequired >= 5) return "senior";
    if (yearsRequired <= 2) return "entry";
    if (yearsRequired <= 4) return "mid";
  }

  const signals = countSenioritySignals(blob, onto);
  if (signals.senior > signals.entry && signals.senior >= 2) return "senior";
  if (signals.entry > signals.senior) return "entry";
  return "unknown";
}
