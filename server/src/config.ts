import dotenv from "dotenv";
import { z } from "zod";
import { resolveEnvPaths } from "./env-files.js";

// npm --prefix runs server scripts with /server as cwd, while the documented
// local setup keeps .env at the repository root. Support both launch layouts.
dotenv.config({ path: resolveEnvPaths(), quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/tasklite"),
  JWT_SECRET: z.string().min(32).default("development-only-secret-change-me-now"),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@example.com"),
  APP_URL: z.string().url().default("http://localhost:5173")
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
if (isProduction && (!process.env.JWT_SECRET || !process.env.MONGODB_URI || !process.env.APP_URL)) {
  throw new Error("Production requires JWT_SECRET, MONGODB_URI, and APP_URL");
}
