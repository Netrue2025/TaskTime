import { Router } from "express";
import webPush from "web-push";
import { env } from "../config.js";
import { PushSubscription, User } from "../models.js";

export const pushRouter = Router();
pushRouter.get("/public-key", (_req, res) => res.json({ publicKey: env.VAPID_PUBLIC_KEY || null }));
pushRouter.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: "Invalid push subscription" });
  const userId = req.userId;
  await PushSubscription.findOneAndUpdate({ endpoint }, { userId, endpoint, keys, userAgent: req.get("user-agent") || "" }, { upsert: true, new: true });
  await User.findByIdAndUpdate(userId, { notificationEnabled: true }); res.status(201).json({ ok: true });
});
pushRouter.delete("/unsubscribe", async (req, res) => {
  const userId = req.userId;
  await PushSubscription.deleteMany({ userId, ...(req.body?.endpoint ? { endpoint: req.body.endpoint } : {}) });
  await User.findByIdAndUpdate(userId, { notificationEnabled: false }); res.status(204).end();
});
pushRouter.post("/test", async (req, res) => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return res.status(503).json({ error: "Push is not configured" });
  const subscriptions = await PushSubscription.find({ userId: req.userId });
  await Promise.all(subscriptions.map(async sub => {
    try { await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } }, JSON.stringify({ title: "TaskLite notifications are ready", body: "You’ll receive reminders for pending tasks.", url: "/", silent: false })); }
    catch (e: any) { if ([404, 410].includes(e?.statusCode)) await sub.deleteOne(); }
  }));
  res.json({ sent: subscriptions.length });
});
