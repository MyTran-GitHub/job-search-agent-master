import type { JobFunction } from "../utils/constants.js";
import type { Job } from "../utils/schema_validator.js";

interface TaxonomyRule {
  function: JobFunction;
  titleKeywords: RegExp[];
  descriptionKeywords: RegExp[];
}

const TAXONOMY: TaxonomyRule[] = [
  {
    function: "GeospatialEngineering",
    titleKeywords: [
      /geospatial\s+engineer/i,
      /gis\s+developer/i,
      /spatial\s+engineer/i,
      /mapping\s+engineer/i,
    ],
    descriptionKeywords: [
      /postgis/i,
      /gdal/i,
      /spatial\s+database/i,
      /geoprocessing/i,
      /etl\s+pipeline/i,
    ],
  },
  {
    function: "GISAnalyst",
    titleKeywords: [
      /gis\s+analyst/i,
      /cartographer/i,
      /spatial\s+analyst/i,
      /mapping\s+specialist/i,
    ],
    descriptionKeywords: [
      /arcgis/i,
      /qgis/i,
      /cartography/i,
      /spatial\s+analysis/i,
      /field\s+data/i,
    ],
  },
  {
    function: "GeoAIResearch",
    titleKeywords: [
      /geoai/i,
      /remote\s+sensing\s+ml/i,
      /geospatial\s+ml/i,
      /earth\s+observation\s+ai/i,
    ],
    descriptionKeywords: [
      /deep\s+learning/i,
      /satellite\s+imagery/i,
      /computer\s+vision/i,
      /pytorch/i,
      /tensorflow/i,
    ],
  },
  {
    function: "EnvironmentalDS",
    titleKeywords: [
      /environmental\s+data\s+scientist/i,
      /environmental\s+analyst/i,
      /climate\s+data/i,
    ],
    descriptionKeywords: [
      /environmental\s+modeling/i,
      /hydrology/i,
      /ecology/i,
      /climate\s+data/i,
      /esg/i,
    ],
  },
  {
    function: "Other",
    titleKeywords: [
      /software\s+engineer/i,
      /data\s+engineer/i,
      /backend/i,
    ],
    descriptionKeywords: [/api/i, /backend/i, /microservices/i],
  },
];

function scoreKeywords(text: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (sum, p) => sum + (p.test(text) ? 1 : 0),
    0
  );
}

export interface ClassificationResult {
  job_function: JobFunction;
  confidence: "high" | "medium" | "low";
  title_score: number;
  description_score: number;
}

export function classifyJobFunction(job: Job): ClassificationResult {
  const titleText = job.title;
  const descText = `${job.description} ${job.requirements.join(" ")}`;

  let best: ClassificationResult = {
    job_function: "Other",
    confidence: "low",
    title_score: 0,
    description_score: 0,
  };

  for (const rule of TAXONOMY) {
    if (rule.function === "Other") continue;

    const titleScore = scoreKeywords(titleText, rule.titleKeywords);
    const descScore = scoreKeywords(descText, rule.descriptionKeywords);

    if (titleScore > best.title_score ||
        (titleScore === best.title_score && descScore > best.description_score)) {
      best = {
        job_function: rule.function,
        confidence:
          titleScore >= 1 ? "high" : descScore >= 2 ? "medium" : "low",
        title_score: titleScore,
        description_score: descScore,
      };
    }
  }

  if (best.title_score === 0 && best.description_score < 2) {
    const otherRule = TAXONOMY.find((r) => r.function === "Other")!;
    const titleScore = scoreKeywords(titleText, otherRule.titleKeywords);
    const descScore = scoreKeywords(descText, otherRule.descriptionKeywords);
    if (titleScore > 0 || descScore > 0) {
      return {
        job_function: "Other",
        confidence: titleScore >= 1 ? "medium" : "low",
        title_score: titleScore,
        description_score: descScore,
      };
    }
  }

  return best;
}
