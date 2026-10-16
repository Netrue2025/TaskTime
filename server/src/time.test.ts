import { describe, expect, it } from "vitest";
import { getPeriodBounds } from "./time.js";

describe("timezone reporting bounds", () => {
  it("uses the responsible user's local midnight", () => {
    const { start, end } = getPeriodBounds("daily", "Africa/Lagos", new Date("2026-10-15T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-10-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-15T22:59:59.999Z");
  });
});
