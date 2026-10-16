import { PASS_THRESHOLD, type ProgressSummary } from "./index.js";

export function calculateProgress(completed: number, total: number): ProgressSummary {
  if (total === 0) return { completed: 0, total: 0, percentage: null, status: "no-score" };
  const percentage = Math.round((completed / total) * 100);
  return {
    completed,
    total,
    percentage,
    status: percentage >= PASS_THRESHOLD ? "passed" : "keep-going"
  };
}
