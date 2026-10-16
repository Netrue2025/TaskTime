import type { ProgressResponse } from "@tasklite/shared";

export function progressCardCopy(progress: Pick<ProgressResponse, "percentage" | "completed" | "total">, date: Date) {
  return {
    headline: progress.percentage == null ? "A fresh day awaits." : "Congratulations!",
    percentage: progress.percentage == null ? "—" : `${progress.percentage}%`,
    count: `${progress.completed} of ${progress.total} tasks completed`,
    date: new Intl.DateTimeFormat([], { dateStyle: "long" }).format(date)
  };
}
