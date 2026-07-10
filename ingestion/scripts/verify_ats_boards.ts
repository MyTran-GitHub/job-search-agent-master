import { fetchPriorityAtsJobs, loadTargetAtsBoards } from "../sources/priority_ats.js";

async function main() {
  const boards = await loadTargetAtsBoards();
  console.log(`Loaded ${boards.length} ATS boards:`);
  for (const b of boards) {
    console.log(`  ${b.provider}:${b.token} → ${b.company}`);
  }
  const jobs = await fetchPriorityAtsJobs();
  console.log(`\nFetched ${jobs.length} jobs after seniority filter`);
  const byCompany = new Map<string, number>();
  for (const j of jobs) {
    byCompany.set(j.company, (byCompany.get(j.company) ?? 0) + 1);
  }
  for (const [co, n] of [...byCompany.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${co}: ${n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
