import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  timezone: z.string().min(1).max(80)
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const taskFields = {
  title: z.string().trim().min(1).max(160),
  note: z.string().trim().max(2000).default(""),
  scheduledAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  timezone: z.string().min(1).max(80),
  reminderEnabled: z.boolean().default(true),
  assigneeId: z.string().regex(/^[a-f\d]{24}$/).optional()
};
const endsAfterStart = (value: { scheduledAt?: string; endsAt?: string }) => !value.scheduledAt || !value.endsAt || new Date(value.endsAt) > new Date(value.scheduledAt);
export const taskSchema = z.object(taskFields).refine(endsAfterStart, { message: "End time must be after start time", path: ["endsAt"] });
export const taskUpdateSchema = z.object({
  title: taskFields.title.optional(), note: z.string().trim().max(2000).optional(), scheduledAt: taskFields.scheduledAt.optional(),
  endsAt: taskFields.endsAt.optional(), timezone: taskFields.timezone.optional(), reminderEnabled: z.boolean().optional(), assigneeId: taskFields.assigneeId
}).refine(endsAfterStart, { message: "End time must be after start time", path: ["endsAt"] });
export const remarkSchema = z.object({ message: z.string().trim().min(1).max(600) });
export const assignmentSchema = z.object({ assigneeId: z.string().regex(/^[a-f\d]{24}$/) });
export const projectSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).default("") });
export const projectUpdateSchema = projectSchema.partial();
export const projectSectionSchema = z.object({ title: z.string().trim().min(1).max(160) });
export const projectMemberSchema = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/) });
