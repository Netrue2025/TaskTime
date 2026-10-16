import { describe, expect, it } from "vitest";
import { calculateProgress } from "./progress.js";

describe("calculateProgress", () => {
  it("passes at 70 percent", () => expect(calculateProgress(7, 10).status).toBe("passed"));
  it("does not pass at 69 percent", () => expect(calculateProgress(69, 100).status).toBe("keep-going"));
  it("returns no-score for zero tasks", () => expect(calculateProgress(0, 0).status).toBe("no-score"));
});
