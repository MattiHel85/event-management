import { hash, compare } from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { toObjectId } from "../lib/objectId.js";
import { isEmailConfigured, sendEmail } from "../lib/mailer.js";
import { OrganizationMemberModel } from "../models/OrganizationMember.js";
import { OrganizationModel } from "../models/Organization.js";
import { UserModel } from "../models/User.js";
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
  remember: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().trim().max(120).nullable(),
  email: z.string().trim().toLowerCase(),
});

function authCookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}

function authCookieOptions(remember: boolean) {
  return {
    ...authCookieBaseOptions(),
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 * 1000 } : {}),
  };
}

function signSessionToken(userId: string, remember: boolean) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: remember ? "30d" : "12h" });
}

type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  memberships: Array<{
    id: string;
    role: string;
    organizationId: string;
    organization: { id: string; name: string; slug: string } | null;
  }>;
};

async function loadSafeUser(userId: string): Promise<SafeUser | null> {
  const objectId = toObjectId(userId);
  if (!objectId) return null;

  const user: any = await UserModel.findById(objectId)
    .select("_id name email role createdAt updatedAt")
    .lean();

  if (!user) return null;

  const memberships: any[] = await OrganizationMemberModel.find({ userId: objectId })
    .select("_id role organizationId")
    .lean();

  const orgIds = memberships.map((membership) => membership.organizationId);
  const organizations: any[] = await OrganizationModel.find({ _id: { $in: orgIds } })
    .select("_id name slug")
    .lean();

  const organizationById = new Map(organizations.map((org) => [String(org._id), org]));

  return {
    id: String(user._id),
    name: user.name ?? null,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    memberships: memberships.map((membership) => {
      const organization = organizationById.get(String(membership.organizationId));
      return {
        id: String(membership._id),
        role: membership.role,
        organizationId: String(membership.organizationId),
        organization: organization
          ? {
              id: String(organization._id),
              name: organization.name,
              slug: organization.slug,
            }
          : null,
      };
    }),
  };
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

    const user: any = await UserModel.create({
      name: name || null,
      email,
      passwordHash,
    });

    const safeUser = await loadSafeUser(String(user._id));

    if (!safeUser) {
      return res.status(500).json({ error: "Failed to load user profile" });
    }

    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: safeUser.email,
          subject: "Welcome to Event Management",
          text: `Hi ${safeUser.name ?? "there"},\n\nWelcome to Event Management. Your account is ready and you can now start planning events.\n\n- Event Management Team`,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return res.status(201).json(safeUser);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : null;

    if (code === 11000) {
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

  const { email, password, remember = false } = parsed.data;

  try {
    const user: any = await UserModel.findOne({ email }).select("_id passwordHash").lean();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signSessionToken(String(user._id), remember);

    res.cookie(TOKEN_COOKIE, token, authCookieOptions(remember));

    const safeUser = await loadSafeUser(String(user._id));

    if (!safeUser) {
      return res.status(500).json({ error: "Failed to load user profile" });
    }

    return res.json({
      message: "Sign in successful",
      user: safeUser,
    });
  } catch {
    return res.status(500).json({ error: "Failed to sign in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await loadSafeUser(req.auth!.userId);

    if (!user) {
      res.clearCookie(TOKEN_COOKIE, authCookieBaseOptions());
      return res.status(401).json({ error: "Session is invalid" });
    }

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to load current user" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile payload" });
  }

  const userObjectId = toObjectId(req.auth.userId);
  if (!userObjectId) {
    return res.status(401).json({ error: "Invalid session" });
  }

  try {
    await UserModel.findByIdAndUpdate(userObjectId, {
      $set: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });

    const user = await loadSafeUser(req.auth.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : null;
    if (code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, authCookieBaseOptions());
  return res.json({ message: "Signed out" });
});

export default router;
