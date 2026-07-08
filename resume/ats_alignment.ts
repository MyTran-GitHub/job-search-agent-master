import type { Job } from "../utils/schema_validator.js";
import { getNormalizedTerms } from "../engine/requirement_normalizer.js";

export interface AtsAlignmentResult {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  total_keywords: number;
}

function extractKeywords(text: string): string[] {
  const terms: string[] = [];
  const patterns = [
    /\b(python|postgis|gdal|arcgis|qgis|pytorch|tensorflow|aws|gcp|sql|geopandas|rasterio|shapely|scikit-learn|machine learning|remote sensing|gis|geoai|etl|geoprocessing|spatial analysis|cartography|sentinel|landsat)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      terms.push(...matches.map((m) => m.toLowerCase()));
    }
  }

  return [...new Set(terms)];
}

export function computeAtsAlignment(
  job: Job,
  experienceText: string
): AtsAlignmentResult {
  const jobKeywords = extractKeywords(
    `${job.title} ${job.description} ${getNormalizedTerms(job.requirements).join(" ")}`
  );
  const experienceKeywords = extractKeywords(experienceText);

  const matched = jobKeywords.filter((k) =>
    experienceKeywords.some(
      (e) => e.includes(k) || k.includes(e)
    )
  );
  const missing = jobKeywords.filter(
    (k) => !matched.includes(k)
  );

  const score =
    jobKeywords.length > 0
      ? Math.round((matched.length / jobKeywords.length) * 100)
      : 50;

  return {
    score,
    matched_keywords: matched,
    missing_keywords: missing,
    total_keywords: jobKeywords.length,
  };
}
