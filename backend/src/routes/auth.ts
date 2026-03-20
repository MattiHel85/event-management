import { hash, compare } from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const TOKEN_COOKIE = "session_token";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().toLowerCase(),
  password: z.string().min(8),
});

const signinSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

function authCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  };
}

function signSessionToken(userId: string) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const name = parsed.data.name?.trim();
  const email = parsed.data.email;
  const password = parsed.data.password;

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }

    return res.status(500).json({ error: "Failed to sign up user" });
  }
});

router.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signSessionToken(user.id);

    res.cookie(TOKEN_COOKIE, token, authCookieOptions());

    return res.json({
      message: "Sign in successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to sign in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      res.clearCookie(TOKEN_COOKIE, authCookieOptions());
      return res.status(401).json({ error: "Session is invalid" });
    }

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to load current user" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, authCookieOptions());
  return res.json({ message: "Signed out" });
});

export default router;
