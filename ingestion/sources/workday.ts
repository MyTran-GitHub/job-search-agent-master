import { stripHtml } from "../../utils/text_normalizer.js";
import type { RawJobInput } from "../normalize_job.js";

interface WorkdayJob {
  title: string;
  externalPath?: string;
  locationsText?: string;
  postedOn?: string;
  timeType?: string;
}

interface WorkdayResponse {
  jobPostings?: WorkdayJob[];
  total?: number;
}

export async function fetchWorkdayJobs(
  tenant: string,
  site: string,
  wdInstance: string,
  searchText = "",
  companyName?: string
): Promise<RawJobInput[]> {
  const baseUrl = `https://${tenant}.${wdInstance}.myworkdayjobs.com`;
  const url = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      limit: 20,
      offset: 0,
      searchText,
      appliedFacets: {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Workday fetch failed (${response.status})`);
  }

  const data = (await response.json()) as WorkdayResponse;
  const company = companyName ?? tenant;

  const jobs: RawJobInput[] = [];

  for (const posting of data.jobPostings ?? []) {
    let description = posting.title;
    if (posting.externalPath) {
      try {
        const detailUrl = `${baseUrl}/wday/cxs/${tenant}/${site}${posting.externalPath}`;
        const detailRes = await fetch(detailUrl);
        if (detailRes.ok) {
          const detail = (await detailRes.json()) as {
            jobPostingInfo?: { jobDescription?: string };
          };
          description = stripHtml(
            detail.jobPostingInfo?.jobDescription ?? posting.title
          );
        }
      } catch {
        description = posting.title;
      }
    }

    jobs.push({
      title: posting.title,
      company,
      description,
      location: posting.locationsText ?? "Unknown",
      employment_type: posting.timeType,
      source_url: posting.externalPath
        ? `${baseUrl}${posting.externalPath}`
        : baseUrl,
      source: "workday",
      posting_age: posting.postedOn,
    });
  }

  return jobs;
}
