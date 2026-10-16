import { Router } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { clearSession, requireAuth, setSession, signSession } from "../auth.js";
import { User } from "../models.js";
import { loginSchema, registerSchema } from "../validation.js";
import { userDTO } from "../serializers.js";

export const authRouter = Router();
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });

authRouter.post("/register", authLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const { password, ...data } = parsed.data;
  if (await User.exists({ $or: [{ email: data.email }, { username: data.username }] })) return res.status(409).json({ error: "Email or username is already in use" });
  const user = await User.create({ ...data, passwordHash: await bcrypt.hash(password, 12) });
  setSession(res, signSession(String(user._id)));
  res.status(201).json({ user: userDTO(user) });
});

authRouter.post("/login", authLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email or password" });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
  if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash)) return res.status(401).json({ error: "Invalid email or password" });
  setSession(res, signSession(String(user._id)));
  res.json({ user: userDTO(user) });
});

authRouter.post("/logout", (_req, res) => { clearSession(res); res.status(204).end(); });
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Account not found" });
  res.json({ user: userDTO(user), timezone: user.timezone, notificationEnabled: user.notificationEnabled });
});
