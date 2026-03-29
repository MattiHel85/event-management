import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const TOKEN_COOKIE = "session_token";

const ORG_ROLE_RANK: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

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

export async function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true },
    });

    if (user?.role !== "PLATFORM_ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch {
    return res.status(500).json({ error: "Authorization check failed" });
  }
}

export function requireOrgRole(minRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const orgIdParam = req.params.orgId;
    const orgId = Array.isArray(orgIdParam) ? orgIdParam[0] : orgIdParam;

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    try {
      const membership = await prisma.organizationMember.findFirst({
        where: { organizationId: orgId, userId: req.auth.userId },
        select: { role: true },
      });

      if (!membership) {
        return res.status(403).json({ error: "Not a member of this organization" });
      }

      const userRank = ORG_ROLE_RANK[membership.role] ?? 0;
      const requiredRank = ORG_ROLE_RANK[minRole] ?? 0;

      if (userRank < requiredRank) {
        return res.status(403).json({ error: "Insufficient organization permissions" });
      }

      return next();
    } catch {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
}