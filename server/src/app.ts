import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { env, isProduction } from "./config.js";
import { requireAuth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { taskRouter } from "./routes/tasks.js";
import { progressRouter } from "./routes/progress.js";
import { pushRouter } from "./routes/push.js";
import { usersRouter } from "./routes/users.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
// express-mongo-sanitize's bundled middleware reassigns req.query, which is a
// read-only getter in Express 5. Its sanitizer itself mutates safely in place.
app.use((req, _res, next) => {
  const sanitize = (mongoSanitize as typeof mongoSanitize & { sanitize: (target: unknown, options: { replaceWith: string }) => unknown }).sanitize;
  if (req.body) sanitize(req.body, { replaceWith: "_" });
  if (req.params) sanitize(req.params, { replaceWith: "_" });
  if (req.query) sanitize(req.query, { replaceWith: "_" });
  next();
});
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/tasks", requireAuth, taskRouter);
app.use("/api/progress", requireAuth, progressRouter);
app.use("/api/push", requireAuth, pushRouter);
app.use("/api/users", requireAuth, usersRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error); res.status(error?.name === "ValidationError" ? 400 : 500).json({ error: error?.name === "ValidationError" ? "Invalid request" : "Something went wrong" });
});

const dirname = path.dirname(fileURLToPath(import.meta.url));
const client = path.resolve(dirname, "../../client/dist");
const clientIndex = path.join(client, "index.html");

// Railway may not set NODE_ENV automatically. Serve the compiled PWA based on
// the artifact that the build produces, rather than an environment flag.
if (existsSync(clientIndex)) {
  app.use(express.static(client, { maxAge: "1y", immutable: true, index: false }));
  app.get("/{*splat}", (_req, res) => res.sendFile(clientIndex));
} else if (isProduction) {
  console.error(`Client build is missing at ${clientIndex}`);
}
