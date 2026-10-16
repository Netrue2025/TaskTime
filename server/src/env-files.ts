import path from "node:path";

export function resolveEnvPaths(cwd = process.cwd()) {
  return [path.resolve(cwd, ".env"), path.resolve(cwd, "../.env")];
}
