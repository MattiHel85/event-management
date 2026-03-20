import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const TOKEN_COOKIE = "session_token";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE] as string | undefined;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: "Server auth is not configured" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded?.userId || typeof decoded.userId !== "string") {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.auth = decoded as JwtPayload & { userId: string };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
