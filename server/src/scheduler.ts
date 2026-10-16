import { Agenda } from "agenda";
import webPush from "web-push";
import { env } from "./config.js";
import { PushSubscription, Task } from "./models.js";

let agenda: Agenda | null = null;
export const START_REMINDER_JOB = "send task start reminder";
export const OVERDUE_REMINDER_JOB = "send overdue task reminder";

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function sendPushToUser(userId: unknown, payload: Record<string, unknown>) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return 0;
  const subscriptions = await PushSubscription.find({ userId });
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys as { p256dh: string; auth: string } }, JSON.stringify({ silent: false, ...payload }));
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await subscription.deleteOne();
    }
  }));
  return subscriptions.length;
}

export async function initScheduler() {
  agenda = new Agenda({ db: { address: env.MONGODB_URI, collection: "agendaJobs" }, processEvery: "20 seconds" });
  agenda.define(START_REMINDER_JOB, async (job: any) => {
    const task = await Task.findById(job.attrs.data.taskId);
    if (!task || task.status !== "pending" || !task.reminderEnabled) return;
    await sendPushToUser(task.assignedTo, { title: "Up next", body: task.title, notificationType: "start", taskId: String(task._id), url: `/?task=${task._id}` });
  });
  agenda.define(OVERDUE_REMINDER_JOB, async (job: any) => {
    const task = await Task.findById(job.attrs.data.taskId);
    if (!task || task.status !== "pending" || !task.reminderEnabled) return;
    const payload = { title: "🔴 Overdue task", body: `${task.title} needs your attention`, notificationType: "overdue", taskId: String(task._id), url: `/?task=${task._id}` };
    await sendPushToUser(task.assignedTo, payload);
    if (String(task.ownerId) !== String(task.assignedTo)) await sendPushToUser(task.ownerId, payload);
  });
  await agenda.start();
  // Replace jobs created by older deployments and ensure persisted pending tasks
  // receive both reminders after a restart or rollout.
  await agenda.cancel({ name: "send task reminder" });
  const now = new Date();
  for await (const task of Task.find({ status: "pending", reminderEnabled: true }).cursor()) {
    if (task.scheduledAt > now || getTaskEnd(task) > now) await scheduleReminders(task);
  }
  return agenda;
}

type ReminderTask = { _id: unknown; scheduledAt: Date; endsAt?: Date | null; reminderEnabled: boolean; status: string; reminderJobId?: string | null; overdueReminderJobId?: string | null };

export function getTaskEnd(task: Pick<ReminderTask, "scheduledAt" | "endsAt">) {
  return task.endsAt instanceof Date ? task.endsAt : new Date(task.scheduledAt.getTime() + 60 * 60 * 1000);
}

export async function scheduleReminders(task: ReminderTask) {
  await cancelReminders(task);
  if (!agenda || !task.reminderEnabled || task.status !== "pending") return { startJobId: null, overdueJobId: null };
  const now = new Date();
  let startJobId: string | null = null;
  let overdueJobId: string | null = null;
  if (task.scheduledAt > now) {
    const job = agenda.create(START_REMINDER_JOB, { taskId: String(task._id) });
    job.schedule(task.scheduledAt); await job.save(); startJobId = String(job.attrs._id);
  }
  const endsAt = getTaskEnd(task);
  if (endsAt > now) {
    const job = agenda.create(OVERDUE_REMINDER_JOB, { taskId: String(task._id) });
    job.schedule(endsAt); await job.save(); overdueJobId = String(job.attrs._id);
  }
  await Task.findByIdAndUpdate(task._id, { reminderJobId: startJobId, overdueReminderJobId: overdueJobId });
  return { startJobId, overdueJobId };
}

export async function cancelReminders(task: Pick<ReminderTask, "_id" | "reminderJobId" | "overdueReminderJobId">) {
  if (!agenda) return;
  await agenda.cancel({ name: { $in: [START_REMINDER_JOB, OVERDUE_REMINDER_JOB] }, "data.taskId": String(task._id) });
  if (task.reminderJobId || task.overdueReminderJobId) await Task.findByIdAndUpdate(task._id, { reminderJobId: null, overdueReminderJobId: null });
}

export async function stopScheduler() { if (agenda) await agenda.stop(); }
export function getAgenda() { return agenda; }
