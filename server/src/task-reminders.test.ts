import { describe, expect, it } from "vitest";
import { getTaskEnd } from "./scheduler.js";
import { taskSchema, taskUpdateSchema } from "./validation.js";

describe("task time ranges", () => {
  const base = {
    title: "Plan tomorrow",
    note: "",
    scheduledAt: "2026-10-16T09:00:00.000Z",
    endsAt: "2026-10-16T10:00:00.000Z",
    timezone: "Africa/Lagos",
    reminderEnabled: true
  };

  it("requires an end after the start", () => {
    expect(taskSchema.safeParse(base).success).toBe(true);
    expect(taskSchema.safeParse({ ...base, endsAt: base.scheduledAt }).success).toBe(false);
    expect(taskUpdateSchema.safeParse({ scheduledAt: base.scheduledAt, endsAt: "2026-10-16T08:00:00.000Z" }).success).toBe(false);
  });

  it("gives legacy tasks a one-hour effective end", () => {
    const scheduledAt = new Date(base.scheduledAt);
    expect(getTaskEnd({ scheduledAt, endsAt: null }).toISOString()).toBe(base.endsAt);
  });
});
