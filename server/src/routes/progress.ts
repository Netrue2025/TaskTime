import { Router } from "express";
import mongoose from "mongoose";
import { calculateProgress } from "@tasklite/shared";
import { Task, User } from "../models.js";
import { fromZonedParts, getPeriodBounds, shiftLocal, type Period } from "../time.js";

export const progressRouter = Router();

async function summary(userId: string, start: Date, end: Date) {
  const [result] = await Task.aggregate([
    { $match: { $or: [{ assignedTo: new mongoose.Types.ObjectId(userId) }, { ownerId: new mongoose.Types.ObjectId(userId) }], scheduledAt: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } }
  ]);
  return calculateProgress(result?.completed ?? 0, result?.total ?? 0);
}

progressRouter.get("/:period", async (req, res) => {
  const period = req.params.period as Period;
  if (!["daily", "weekly", "monthly"].includes(period)) return res.status(404).json({ error: "Unknown period" });
  const userId = req.userId;
  const user = await User.findById(userId).select("timezone");
  const timezone = user?.timezone || "UTC";
  const bounds = getPeriodBounds(period, timezone);
  const result: any = { ...(await summary(userId, bounds.start, bounds.end)), label: period === "daily" ? "Today" : new Intl.DateTimeFormat("en", { timeZone: timezone, ...(period === "weekly" ? { month: "short", day: "numeric" } as const : { month: "long" } as const) }).format(bounds.start) };
  if (period === "weekly") {
    result.points = await Promise.all(Array.from({ length: 7 }, async (_, i) => {
      const local = shiftLocal(bounds.startParts, i); const next = shiftLocal(bounds.startParts, i + 1);
      const start = fromZonedParts(local, timezone); const end = new Date(fromZonedParts(next, timezone).getTime() - 1);
      const label = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(local.year, local.month - 1, local.day)));
      return { ...(await summary(userId, start, end)), label, start: start.toISOString() };
    }));
  }
  if (period === "monthly") {
    result.points = await Promise.all(Array.from({ length: 5 }, async (_, i) => {
      const local = shiftLocal(bounds.startParts, i * 7); const next = shiftLocal(bounds.startParts, (i + 1) * 7);
      const start = fromZonedParts(local, timezone); const end = new Date(Math.min(fromZonedParts(next, timezone).getTime() - 1, bounds.end.getTime()));
      return { ...(await summary(userId, start, end)), label: `Week ${i + 1}`, start: start.toISOString() };
    }));
  }
  res.json(result);
});
