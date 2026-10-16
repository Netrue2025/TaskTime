import mongoose from "mongoose";
import { app } from "./app.js";
import { env } from "./config.js";
import { initScheduler, stopScheduler } from "./scheduler.js";

await mongoose.connect(env.MONGODB_URI);
await initScheduler();
const server = app.listen(env.PORT, "0.0.0.0", () => console.log(`TaskLite listening on ${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal}: shutting down`); server.close(); await stopScheduler(); await mongoose.disconnect(); process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
