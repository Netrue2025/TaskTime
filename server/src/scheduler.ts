import { Agenda } from "agenda";
import webPush from "web-push";
import { env } from "./config.js";
import { PushSubscription, Task } from "./models.js";

let agenda: Agenda | null = null;
export const REMINDER_JOB = "send task reminder";

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
  agenda.define(REMINDER_JOB, async (job: any) => {
    const task = await Task.findById(job.attrs.data.taskId);
    if (!task || task.status !== "pending" || !task.reminderEnabled) return;
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
    await sendPushToUser(task.assignedTo, { title: "Task Reminder", body: task.title, taskId: String(task._id), url: `/?task=${task._id}` });
  });
  await agenda.start();
  return agenda;
}

export async function scheduleReminder(task: { _id: unknown; scheduledAt: Date; reminderEnabled: boolean; status: string; reminderJobId?: string | null }) {
  await cancelReminder(task);
  if (!agenda || !task.reminderEnabled || task.status !== "pending" || task.scheduledAt <= new Date()) return null;
  const job = agenda.create(REMINDER_JOB, { taskId: String(task._id) });
  job.schedule(task.scheduledAt);
  await job.save();
  await Task.findByIdAndUpdate(task._id, { reminderJobId: String(job.attrs._id) });
  return String(job.attrs._id);
}

export async function cancelReminder(task: { _id: unknown; reminderJobId?: string | null }) {
  if (!agenda) return;
  await agenda.cancel({ name: REMINDER_JOB, "data.taskId": String(task._id) });
  if (task.reminderJobId) await Task.findByIdAndUpdate(task._id, { reminderJobId: null });
}

export async function stopScheduler() { if (agenda) await agenda.stop(); }
export function getAgenda() { return agenda; }
