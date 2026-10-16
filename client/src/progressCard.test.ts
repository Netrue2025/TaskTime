import { describe, expect, it } from "vitest";
import { progressCardCopy } from "./progressCard";

describe("progress card privacy", () => {
  it("contains totals and no private task fields", () => {
    const copy = progressCardCopy({ percentage: 80, completed: 8, total: 10 }, new Date("2026-10-15T12:00:00Z"));
    expect(copy.percentage).toBe("80%");
    expect(copy.count).toBe("8 of 10 tasks completed");
    expect(JSON.stringify(copy)).not.toContain("title");
  });
});
