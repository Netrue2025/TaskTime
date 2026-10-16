export const PASS_THRESHOLD = 70;

export type TaskStatus = "pending" | "completed" | "cancelled";
export type CompletionMode = "assignee" | "owner" | "owner_on_behalf" | null;

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  email?: string;
}

export interface TaskDTO {
  id: string;
  owner: UserSummary;
  assignedTo: UserSummary;
  title: string;
  note: string;
  scheduledAt: string;
  endsAt: string;
  timezone: string;
  status: TaskStatus;
  reminderEnabled: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByUser: UserSummary | null;
  completionMode: CompletionMode;
  createdAt: string;
}

export interface ProgressSummary {
  completed: number;
  total: number;
  percentage: number | null;
  status: "passed" | "keep-going" | "no-score";
}

export interface PeriodPoint extends ProgressSummary {
  label: string;
  start: string;
}

export interface ProgressResponse extends ProgressSummary {
  label: string;
  points?: PeriodPoint[];
}

export { calculateProgress } from "./progress.js";
