import { Router } from "express";
import { User } from "../models.js";
import { userDTO } from "../serializers.js";

export const usersRouter = Router();
usersRouter.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 80);
  if (q.length < 2) return res.json({ users: [] });
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({ _id: { $ne: req.userId }, $or: [{ username: new RegExp(`^${safe}`, "i") }, { email: new RegExp(`^${safe}`, "i") }] }).limit(8);
  res.json({ users: users.map(userDTO) });
});
