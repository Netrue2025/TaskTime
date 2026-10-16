import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveEnvPaths } from "./env-files.js";

describe("environment file discovery", () => {
  it("loads both a package-local and repository-level .env", () => {
    const serverDirectory = path.join("workspace", "tasklite", "server");
    expect(resolveEnvPaths(serverDirectory)).toEqual([
      path.resolve(serverDirectory, ".env"),
      path.resolve(serverDirectory, "../.env")
    ]);
  });
});
