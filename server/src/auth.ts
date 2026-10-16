import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isProduction } from "./config.js";

declare global { namespace Express { interface Request { userId: string } } }
export type AuthedRequest = Request;
const COOKIE = "tasklite_session";

export function signSession(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "30d" });
}

export function setSession(res: Response, token: string) {
  res.cookie(COOKIE, token, { httpOnly: true, secure: isProduction, sameSite: "lax", maxAge: 30 * 86400_000, path: "/" });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, secure: isProduction, sameSite: "lax", path: "/" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: "Please sign in" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    req.userId = String(payload.sub);
    next();
  } catch { res.status(401).json({ error: "Your session has expired" }); }
}
