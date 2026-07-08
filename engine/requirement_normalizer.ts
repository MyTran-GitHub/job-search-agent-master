const NORMALIZATION_MAP: Array<{ pattern: RegExp; normalized: string }> = [
  { pattern: /raster\/?vector\s+analysis/i, normalized: "geoprocessing, spatial analysis, GIS raster workflows" },
  { pattern: /cloud\s+computing/i, normalized: "AWS, GCP, distributed pipelines" },
  { pattern: /machine\s+learning/i, normalized: "PyTorch, scikit-learn, GeoAI models" },
  { pattern: /remote\s+sensing/i, normalized: "satellite imagery, earth observation, multispectral analysis" },
  { pattern: /spatial\s+databases?/i, normalized: "PostGIS, GeoPackage, spatial SQL" },
  { pattern: /\betl\b/i, normalized: "data pipelines, geospatial ETL, batch processing" },
  { pattern: /cartography/i, normalized: "map design, visualization, symbology" },
  { pattern: /field\s+data\s+collection/i, normalized: "GPS surveying, ground-truthing, mobile GIS" },
  { pattern: /geoprocessing/i, normalized: "geoprocessing, spatial analysis" },
  { pattern: /gis/i, normalized: "GIS, spatial analysis" },
];

export interface NormalizedRequirement {
  original: string;
  normalized: string;
  was_mapped: boolean;
}

export function normalizeRequirement(text: string): NormalizedRequirement {
  for (const { pattern, normalized } of NORMALIZATION_MAP) {
    if (pattern.test(text)) {
      return { original: text, normalized, was_mapped: true };
    }
  }
  return { original: text, normalized: text, was_mapped: false };
}

export function normalizeRequirements(
  requirements: string[]
): NormalizedRequirement[] {
  return requirements.map(normalizeRequirement);
}

export function getNormalizedTerms(requirements: string[]): string[] {
  return normalizeRequirements(requirements).map((r) => r.normalized);
}
