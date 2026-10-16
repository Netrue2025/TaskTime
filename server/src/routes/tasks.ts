import { Router } from "express";
import mongoose from "mongoose";
import { Task, TaskRemark, User } from "../models.js";
import { assignmentSchema, remarkSchema, taskSchema, taskUpdateSchema } from "../validation.js";
import { taskDTO, userDTO } from "../serializers.js";
import { cancelReminders, scheduleReminders, sendPushToUser } from "../scheduler.js";

export const taskRouter = Router();
const populate = [{ path: "ownerId", select: "name username email" }, { path: "assignedTo", select: "name username email" }, { path: "completedBy", select: "name username email" }];
const access = (userId: string) => ({ $or: [{ ownerId: userId }, { assignedTo: userId }] });

taskRouter.get("/", async (req, res) => {
  const userId = req.userId;
  const view = String(req.query.view || "today");
  const query: any = access(userId);
  if (view === "assigned-to-me") Object.assign(query, { assignedTo: userId, ownerId: { $ne: userId } });
  if (view === "assigned-by-me") Object.assign(query, { ownerId: userId, assignedTo: { $ne: userId } });
  if (view === "today") {
    const start = req.query.start ? new Date(String(req.query.start)) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = req.query.end ? new Date(String(req.query.end)) : new Date(new Date().setHours(23, 59, 59, 999));
    query.scheduledAt = { $gte: start, $lte: end };
    query.assignedTo = userId;
  }
  const tasks = await Task.find(query).populate(populate).sort({ scheduledAt: 1 }).limit(250);
  res.json({ tasks: tasks.map(taskDTO) });
});

taskRouter.post("/", async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const userId = req.userId;
  const assignedTo = parsed.data.assigneeId || userId;
  if (!await User.exists({ _id: assignedTo })) return res.status(404).json({ error: "Assignee not found" });
  const task = await Task.create({ ...parsed.data, ownerId: userId, assignedTo });
  await scheduleReminders(task);
  if (assignedTo !== userId) await sendPushToUser(assignedTo, { title: "New task assigned", body: task.title, taskId: String(task._id), url: `/?task=${task._id}` });
  await task.populate(populate);
  res.status(201).json({ task: taskDTO(task) });
});

taskRouter.get("/:id", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...access(req.userId) }).populate(populate);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ task: taskDTO(task) });
});

taskRouter.patch("/:id", async (req, res) => {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found or not owned by you" });
  const { assigneeId, ...changes } = parsed.data;
  const previousAssignee = String(task.assignedTo);
  if (assigneeId && !await User.exists({ _id: assigneeId })) return res.status(404).json({ error: "Assignee not found" });
  Object.assign(task, changes);
  if (assigneeId) task.assignedTo = new mongoose.Types.ObjectId(assigneeId);
  const finalEnd = task.endsAt instanceof Date ? task.endsAt : new Date(task.scheduledAt.getTime() + 60 * 60 * 1000);
  if (finalEnd <= task.scheduledAt) return res.status(400).json({ error: "End time must be after start time" });
  await task.save(); await scheduleReminders(task);
  if (assigneeId && assigneeId !== previousAssignee) await sendPushToUser(task.assignedTo, { title: "New task assigned", body: task.title, notificationType: "assignment", taskId: String(task._id), url: `/?task=${task._id}` });
  await task.populate(populate);
  res.json({ task: taskDTO(task) });
});

taskRouter.delete("/:id", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found or not owned by you" });
  await cancelReminders(task); await TaskRemark.deleteMany({ taskId: task._id }); await task.deleteOne(); res.status(204).end();
});

taskRouter.post("/:id/complete", async (req, res) => {
  const userId = req.userId;
  const task = await Task.findOne({ _id: req.params.id, ...access(userId) });
  if (!task) return res.status(404).json({ error: "Task not found" });
  const isOwner = String(task.ownerId) === userId;
  const isDelegated = String(task.ownerId) !== String(task.assignedTo);
  task.status = "completed"; task.completedAt = new Date(); task.completedBy = new mongoose.Types.ObjectId(userId);
  task.completionMode = isOwner ? (isDelegated ? "owner_on_behalf" : "owner") : "assignee";
  await task.save(); await cancelReminders(task);
  if (isDelegated) {
    const recipient = isOwner ? task.assignedTo : task.ownerId;
    await sendPushToUser(recipient, { title: "Shared task completed", body: task.title, taskId: String(task._id), url: `/?task=${task._id}` });
  }
  await task.populate(populate); res.json({ task: taskDTO(task) });
});

taskRouter.post("/:id/uncomplete", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...access(req.userId) });
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.status = "pending"; task.completedAt = null; task.completedBy = null; task.completionMode = null;
  await task.save(); await scheduleReminders(task); await task.populate(populate); res.json({ task: taskDTO(task) });
});

taskRouter.post("/:id/assign", async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid assignee" });
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!task || !await User.exists({ _id: parsed.data.assigneeId })) return res.status(404).json({ error: "Task or assignee not found" });
  task.assignedTo = new mongoose.Types.ObjectId(parsed.data.assigneeId); await task.save(); await task.populate(populate);
  await sendPushToUser(task.assignedTo, { title: "New task assigned", body: task.title, taskId: String(task._id), url: `/?task=${task._id}` });
  res.json({ task: taskDTO(task) });
});

taskRouter.post("/:id/unassign", async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.assignedTo = task.ownerId; await task.save(); await task.populate(populate); res.json({ task: taskDTO(task) });
});

taskRouter.get("/:id/remarks", async (req, res) => {
  const userId = req.userId;
  if (!await Task.exists({ _id: req.params.id, ...access(userId) })) return res.status(404).json({ error: "Task not found" });
  const remarks = await TaskRemark.find({ taskId: req.params.id }).populate("userId", "name username").sort({ createdAt: 1 });
  res.json({ remarks: remarks.map((r: any) => ({ id: String(r._id), user: userDTO(r.userId), message: r.message, createdAt: r.createdAt })) });
});

taskRouter.post("/:id/remarks", async (req, res) => {
  const parsed = remarkSchema.safeParse(req.body); const userId = req.userId;
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  if (!await Task.exists({ _id: req.params.id, ...access(userId) })) return res.status(404).json({ error: "Task not found" });
  const remark = await TaskRemark.create({ taskId: req.params.id, userId, message: parsed.data.message });
  res.status(201).json({ remark: { id: String(remark._id), message: remark.message, createdAt: remark.createdAt } });
});
