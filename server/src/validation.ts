import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  timezone: z.string().min(1).max(80)
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const taskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  note: z.string().trim().max(2000).default(""),
  scheduledAt: z.iso.datetime(),
  timezone: z.string().min(1).max(80),
  reminderEnabled: z.boolean().default(true),
  assigneeId: z.string().regex(/^[a-f\d]{24}$/).optional()
});
export const taskUpdateSchema = taskSchema.partial();
export const remarkSchema = z.object({ message: z.string().trim().min(1).max(600) });
export const assignmentSchema = z.object({ assigneeId: z.string().regex(/^[a-f\d]{24}$/) });
