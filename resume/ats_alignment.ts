import type { Job } from "../utils/schema_validator.js";
import { normalizeRequirements } from "../engine/requirement_normalizer.js";

export interface AtsAlignmentResult {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  total_keywords: number;
}

/**
 * Capability-aligned extraction.
 *
 * Goal: avoid penalizing jobs just because the experience text doesn't contain the
 * exact JD phrasing. We normalize requirements (e.g. raster/vector → geoprocessing)
 * and then match against the full experience database.
 *
 * This stays deterministic (no LLM), and is intentionally conservative:
 * it only credits a capability if it can find a reasonable lexical witness in the
 * experience corpus.
 */
function extractCapabilityTerms(text: string): string[] {
  const lower = text.toLowerCase();

  // Deterministic, broad witness checks. We deliberately use substring checks
  // (with a few word-boundary regexes) to avoid missing pluralization / hyphens.
  const phrases = [
    "google earth engine",
    "earth observation",
    "remote sensing",
    "satellite imagery",
    "cloud optimized geotiff",
    "cloud-optimized geotiff",
    "planetary computer",
    "spatial analysis",
    "geoprocessing",
    "spatial etl",
    "geospatial etl",
    "data pipeline",
    "data pipelines",
    "spatial sql",
    "cartography",
    "map design",
    "symbology",
    "change detection",
    "time series",
    "suitability",
    "mcda",
    "multi-criteria",
    "causal inference",
    "synthetic control",
    "causal forest",
    "wildfire",
    "burn severity",
    "fire risk",
    "sustainability",
    "esg",
    "carbon",
    "solar",
    "wind",
    "renewable",
    "stac",
    "cog",
    "xarray",
    "dask",
    "zarr",
    "netcdf",
    "geoparquet",
    "computer vision",
    "deep learning",
    "machine learning",
  ];

  const terms: string[] = [];
  for (const p of phrases) {
    if (lower.includes(p)) terms.push(p);
  }

  // Tool tokens (word boundary)
  const toolTokens = [
    "python",
    "sql",
    "postgresql",
    "postgis",
    "gdal",
    "ogr",
    "geopandas",
    "rasterio",
    "shapely",
    "qgis",
    "arcgis",
    "pytorch",
    "tensorflow",
    "scikit-learn",
    "sentinel",
    "landsat",
    "modis",
    "era5",
    "aws",
    "gcp",
  ];
  for (const t of toolTokens) {
    const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) terms.push(t);
  }

  return [...new Set(terms.map((t) => t.toLowerCase()))].filter(Boolean);
}

function splitNormalizedTerms(normalized: string): string[] {
  // Normalizer strings often contain comma-separated expansions
  return normalized
    .split(/,|;|\//g)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2 && s.length < 80);
}

function buildJobCapabilityTargets(job: Job): string[] {
  const normalized = normalizeRequirements(job.requirements)
    .filter((r) => r.was_mapped)
    .flatMap((r) => splitNormalizedTerms(r.normalized))
    .filter(Boolean);

  // Prefer requirements over full description to avoid exploding the target list.
  const lexical = extractCapabilityTerms(
    `${job.title} ${job.description} ${job.requirements.join(" ")}`
  );

  // Bias toward normalized requirement terms; keep lexical tool terms too.
  return [...new Set([...normalized, ...lexical])].slice(0, 28);
}

function buildExperienceWitnessSet(experienceText: string): Set<string> {
  const lower = experienceText.toLowerCase();
  const witnesses = new Set<string>();

  // Add canonical capability terms we can extract directly.
  for (const term of extractCapabilityTerms(lower)) witnesses.add(term);

  // Also add common normalized phrases when they appear as substrings.
  // This allows "raster workflows" etc. to count even if not in the regex list above.
  const extra = [
    "geoprocessing",
    "spatial analysis",
    "gis raster workflows",
    "satellite imagery",
    "earth observation",
    "multispectral analysis",
    "spatial sql",
    "geospatial etl",
    "data pipelines",
    "batch processing",
    "map design",
    "ground-truthing",
  ];
  for (const t of extra) {
    if (lower.includes(t)) witnesses.add(t);
  }

  return witnesses;
}

function hasWitness(witnesses: Set<string>, target: string): boolean {
  if (witnesses.has(target)) return true;
  // Small fuzz: allow substring containment across multiword terms
  for (const w of witnesses) {
    if (w.includes(target) || target.includes(w)) return true;
  }
  return false;
}

export function computeAtsAlignment(
  job: Job,
  experienceText: string
): AtsAlignmentResult {
  const targets = buildJobCapabilityTargets(job);
  const witnesses = buildExperienceWitnessSet(experienceText);

  const matched = targets.filter((t) => hasWitness(witnesses, t));
  const missing = targets.filter((t) => !matched.includes(t));

  const score = targets.length > 0 ? Math.round((matched.length / targets.length) * 100) : 50;

  return {
    score,
    matched_keywords: matched,
    missing_keywords: missing,
    total_keywords: targets.length,
  };
}
