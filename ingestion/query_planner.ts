import { readTextFile } from "../utils/fs_helpers.js";
import { PATHS } from "../utils/constants.js";
import {
  loadClimateOntology,
  type ClimateOntology,
} from "./domain_signals.js";

export interface SearchProfile {
  targetRoles: string[];
  targetIndustries: string[];
  geographicPreferences: string[];
  skills: string[];
  /** Explicit overrides from ## Search Queries (kept as extras, not sole source). */
  explicitQueries: string[];
  maxYearsRequired: number;
}

export interface PlannedQuery {
  query: string;
  strategy:
    | "role_domain"
    | "skill_domain"
    | "seniority_bias"
    | "explicit"
    | "fallback";
  rationale: string;
}

export interface QueryPlan {
  queries: PlannedQuery[];
  profile: SearchProfile;
}

function extractBulletSection(
  markdown: string,
  heading: string
): string[] {
  const re = new RegExp(
    `## ${heading}[\\s\\S]*?(?=##|$)`,
    "i"
  );
  const section = markdown.match(re);
  if (!section) return [];

  const items: string[] = [];
  for (const line of section[0].split("\n")) {
    const match = line.match(/^-\s+(.+)$/);
    if (match) items.push(match[1].trim());
  }
  return items;
}

function extractSkillsFromMarkdown(skillsMd: string): string[] {
  const skills: string[] = [];
  for (const line of skillsMd.split("\n")) {
    // "- **Languages:** Python, SQL" or "- Python, GIS"
    const boldList = line.match(/^-\s+\*\*[^*]+\*\*:\s*(.+)$/);
    if (boldList) {
      for (const part of boldList[1].split(/,/)) {
        const s = part.trim();
        if (s.length > 1) skills.push(s);
      }
      continue;
    }
    const plain = line.match(/^-\s+([^:*].+)$/);
    if (plain && !plain[1].startsWith("<!--")) {
      const chunk = plain[1].split(/,|;/)[0]?.trim();
      if (chunk && chunk.length > 2 && chunk.length < 60) {
        skills.push(chunk);
      }
    }
  }
  return [...new Set(skills)].slice(0, 40);
}

function parseMaxYears(constraintsMd: string): number {
  const match = constraintsMd.match(/max_years_required:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 2;
}

function geoHint(prefs: string[]): string {
  const joined = prefs.join(" ").toLowerCase();
  if (/\bremote\b/.test(joined)) return "remote";
  if (/\bunited states\b|\bus\b/.test(joined)) return "United States";
  return prefs[0] ?? "";
}

function pickDomainPhrases(
  industries: string[],
  ontology: ClimateOntology,
  limit = 4
): string[] {
  const phrases: string[] = [];
  const industryBlob = industries.join(" ").toLowerCase();

  for (const def of Object.values(ontology.domains)) {
    const labelLower = def.label.toLowerCase();
    const keywordsHit = def.keywords.some(
      (kw) =>
        industryBlob.includes(kw.toLowerCase()) ||
        industryBlob.includes(labelLower.split("/")[0].trim())
    );
    const industryMentionsDomain = industries.some((ind) =>
      def.keywords.some(
        (kw) =>
          ind.toLowerCase().includes(kw.toLowerCase()) ||
          kw.toLowerCase().includes(ind.toLowerCase().slice(0, 12))
      )
    );
    if (keywordsHit || industryMentionsDomain) {
      phrases.push(def.keywords[0] ?? def.label);
    }
  }

  // Always include top climate/EO seeds if industries empty or sparse
  if (phrases.length < 2) {
    phrases.push(
      ontology.domains.earth_observation.keywords[0],
      ontology.domains.climate_tech.keywords[0],
      ontology.domains.environmental_ds.keywords[0]
    );
  }

  return [...new Set(phrases)].slice(0, limit);
}

function skillSeeds(
  profileSkills: string[],
  ontology: ClimateOntology,
  limit = 5
): string[] {
  const lowerSkills = profileSkills.map((s) => s.toLowerCase());
  const fromProfile = ontology.skill_query_seeds.filter((seed) =>
    lowerSkills.some(
      (s) => s.includes(seed) || seed.includes(s) || s.includes(seed.split(" ")[0])
    )
  );
  const merged = [
    ...fromProfile,
    ...ontology.skill_query_seeds.filter((s) => !fromProfile.includes(s)),
  ];
  return [...new Set(merged)].slice(0, limit);
}

/**
 * Build search queries from profile sections — not a fixed title lists alone.
 * Strategies: role×domain, skill×domain, seniority-biased, explicit overrides.
 */
export function buildQueryPlan(
  profile: SearchProfile,
  ontology?: ClimateOntology
): QueryPlan {
  const onto = ontology ?? loadClimateOntology();
  const domains = pickDomainPhrases(profile.targetIndustries, onto);
  const skills = skillSeeds(profile.skills, onto);
  const geo = geoHint(profile.geographicPreferences);
  const entryBias = [
    "entry level",
    "junior",
    "new grad",
    "associate",
    "early career",
  ];
  const planned: PlannedQuery[] = [];
  const seen = new Set<string>();

  const add = (
    query: string,
    strategy: PlannedQuery["strategy"],
    rationale: string
  ) => {
    const q = query.replace(/\s+/g, " ").trim();
    if (!q || seen.has(q.toLowerCase())) return;
    seen.add(q.toLowerCase());
    planned.push({ query: q, strategy, rationale });
  };

  // Role × domain (use role family phrases, not exhaustive titles)
  for (const role of profile.targetRoles.slice(0, 4)) {
    for (const domain of domains.slice(0, 2)) {
      add(
        [role, domain, geo].filter(Boolean).join(" "),
        "role_domain",
        `Role family "${role}" × domain "${domain}"`
      );
    }
  }

  // Skill × domain — surfaces alternate titles via skill/problem match
  for (const skill of skills.slice(0, 4)) {
    const domain = domains[skills.indexOf(skill) % domains.length] ?? domains[0];
    add(
      [skill, domain, "jobs", geo].filter(Boolean).join(" "),
      "skill_domain",
      `Skill "${skill}" × domain "${domain}"`
    );
  }

  // Seniority-biased retrieval (positive early-career cues + climate domain)
  for (const domain of domains.slice(0, 2)) {
    for (const senior of entryBias.slice(0, 3)) {
      add(
        `${senior} ${domain} ${skills[0] ?? "gis"}`.trim(),
        "seniority_bias",
        `Early-career bias with domain "${domain}"`
      );
    }
  }

  // Analyst + climate without forcing a specific title brand
  if (domains[0]) {
    add(
      `analyst ${domains[0]} ${geo || "remote"}`.trim(),
      "seniority_bias",
      "Analyst seniority cue with primary domain"
    );
  }

  // Explicit legacy queries from markdown (optional extras)
  for (const q of profile.explicitQueries) {
    add(q, "explicit", "From career_goals ## Search Queries");
  }

  if (planned.length === 0) {
    add(
      "entry level earth observation geospatial remote",
      "fallback",
      "Default climate/EO early-career fallback"
    );
  }

  // Cap to keep scrape cost predictable
  return {
    profile,
    queries: planned.slice(0, 16),
  };
}

function extractSearchQueriesSection(markdown: string): string[] {
  const section = markdown.match(/## Search Queries[\s\S]*?(?=##|$)/i);
  if (!section) return [];
  const items: string[] = [];
  for (const line of section[0].split("\n")) {
    const match = line.match(/^-\s+(.+)$/);
    if (match) {
      const text = match[1].trim();
      if (text.startsWith("(") && text.endsWith(")")) continue;
      items.push(text);
    }
  }
  return items;
}

export async function loadSearchProfile(options?: {
  careerGoalsPath?: string;
  skillsPath?: string;
  constraintsPath?: string;
}): Promise<SearchProfile> {
  const careerGoals =
    (await readTextFile(options?.careerGoalsPath ?? PATHS.careerGoals)) ?? "";
  const skillsMd =
    (await readTextFile(options?.skillsPath ?? PATHS.skills)) ?? "";
  const constraintsMd =
    (await readTextFile(options?.constraintsPath ?? PATHS.constraints)) ?? "";

  return {
    targetRoles: extractBulletSection(careerGoals, "Target Roles"),
    targetIndustries: extractBulletSection(careerGoals, "Target Industries"),
    geographicPreferences: extractBulletSection(
      careerGoals,
      "Geographic Preferences"
    ),
    skills: extractSkillsFromMarkdown(skillsMd),
    explicitQueries: extractSearchQueriesSection(careerGoals),
    maxYearsRequired: parseMaxYears(constraintsMd),
  };
}

/**
 * Back-compat: extract explicit query bullets only.
 * Prefer buildQueryPlan / planSearchQueries for discovery.
 */
export function parseSearchQueries(careerGoalsMarkdown: string): string[] {
  const queries = extractSearchQueriesSection(careerGoalsMarkdown);
  return queries.length > 0
    ? queries
    : ["entry level earth observation geospatial remote"];
}

export async function planSearchQueries(): Promise<QueryPlan> {
  const profile = await loadSearchProfile();
  return buildQueryPlan(profile);
}
