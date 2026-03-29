import { Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const TOKEN_COOKIE = "session_token";

const eventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().trim().min(1),
  location: z.string().trim().min(1),
  capacity: z.number().int().min(1),
  organizationId: z.string().trim().min(1).optional(),
  ticketUrl: z
    .string()
    .trim()
    .default("")
    .refine((value) => value === "" || z.string().url().safeParse(value).success, {
      message: "Invalid ticketUrl",
    }),
  budget: z.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
});

const budgetItemSchema = z.object({
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.number().min(0),
});

function toApiEvent(event: {
  id: string;
  createdById: string | null;
  title: string;
  description: string;
  date: Date;
  location: string;
  capacity: number;
  organizationId: string | null;
  ticketUrl?: string | null;
  budget: number | null;
  currency: string | null;
  createdAt: Date;
  budgetItems?: Array<{ id: string; category: string; description: string; amount: number }>;
}, canViewBudget: boolean) {
  return {
    _id: event.id,
    createdById: event.createdById ?? undefined,
    title: event.title,
    description: event.description,
    date: event.date.toISOString().slice(0, 10),
    location: event.location,
    capacity: event.capacity,
    organizationId: event.organizationId ?? undefined,
    ticketUrl: event.ticketUrl ?? "",
    budget: canViewBudget ? event.budget ?? undefined : undefined,
    currency: event.currency ?? undefined,
    budgetItems: canViewBudget ? event.budgetItems : undefined,
    createdAt: event.createdAt.toISOString(),
  };
}

function getOptionalAuthUserId(req: { cookies?: Record<string, unknown> }) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token || typeof token !== "string") return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!decoded?.userId || typeof decoded.userId !== "string") return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

async function canViewEventBudget(
  userId: string | null,
  event: { organizationId: string | null; createdById: string | null }
) {
  if (!userId) return false;
  if (event.createdById === userId) return true;
  if (!event.organizationId) return false;

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: event.organizationId, userId },
    select: { id: true },
  });

  return Boolean(membership);
}

router.get("/", async (_req, res) => {
  try {
    const userId = getOptionalAuthUserId(_req);
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: { budgetItems: true },
    });

    let allowedOrgIds = new Set<string>();

    if (userId) {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });

      allowedOrgIds = new Set(memberships.map((m) => m.organizationId));
    }

    return res.json(
      events.map((event) => {
        const orgId = event.organizationId;
        const canViewBudget =
          Boolean(userId) &&
          (event.createdById === userId || (orgId ? allowedOrgIds.has(orgId) : false));
        return toApiEvent(event, canViewBudget);
      })
    );
  } catch {
    return res.status(500).json({ error: "Failed to load events" });
  }
});

router.post("/", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const payload = parsed.data;
  const eventDate = new Date(payload.date);

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    const userId = getOptionalAuthUserId(req);
    const created = await prisma.event.create({
      data: {
        createdById: userId,
        title: payload.title,
        description: payload.description,
        date: eventDate,
        location: payload.location,
        capacity: payload.capacity,
        organizationId: payload.organizationId,
        ticketUrl: payload.ticketUrl,
        budget: payload.budget,
        currency: payload.currency ?? "USD",
      },
      include: { budgetItems: true },
    });

    return res.status(201).json(toApiEvent(created, true));
  } catch {
    return res.status(500).json({ error: "Failed to create event" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getOptionalAuthUserId(req);
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { budgetItems: true },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(userId, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });

    return res.json(toApiEvent(event, canViewBudget));
  } catch {
    return res.status(500).json({ error: "Failed to load event" });
  }
});

router.put("/:id", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const payload = parsed.data;
  const eventDate = new Date(payload.date);

  if (Number.isNaN(eventDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  try {
    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        title: payload.title,
        description: payload.description,
        date: eventDate,
        location: payload.location,
        capacity: payload.capacity,
        organizationId: payload.organizationId,
        ticketUrl: payload.ticketUrl,
        budget: payload.budget,
        currency: payload.currency ?? "USD",
      },
      include: { budgetItems: true },
    });

    return res.json(toApiEvent(updated, true));
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(500).json({ error: "Failed to delete event" });
  }
});

router.post("/:id/budget", requireAuth, async (req, res) => {
  const parsed = budgetItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid budget item data" });
  }

  try {
    const eventIdParam = req.params.id;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizationId: true, createdById: true },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(req.auth?.userId ?? null, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });
    if (!canViewBudget) {
      return res.status(403).json({ error: "Not authorized to manage this budget" });
    }

    const created = await prisma.budgetItem.create({
      data: {
        eventId,
        category: parsed.data.category,
        description: parsed.data.description,
        amount: parsed.data.amount,
      },
    });

    return res.status(201).json({
      id: created.id,
      category: created.category,
      description: created.description,
      amount: created.amount,
    });
  } catch {
    return res.status(500).json({ error: "Failed to add budget item" });
  }
});

router.delete("/:id/budget/:itemId", requireAuth, async (req, res) => {
  try {
    const eventIdParam = req.params.id;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
    const itemIdParam = req.params.itemId;
    const itemId = Array.isArray(itemIdParam) ? itemIdParam[0] : itemIdParam;

    if (!eventId || !itemId) {
      return res.status(400).json({ error: "Event ID and item ID are required" });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true, createdById: true },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const canViewBudget = await canViewEventBudget(req.auth?.userId ?? null, {
      organizationId: event.organizationId,
      createdById: event.createdById,
    });
    if (!canViewBudget) {
      return res.status(403).json({ error: "Not authorized to manage this budget" });
    }

    await prisma.budgetItem.delete({ where: { id: itemId } });
    return res.json({ success: true });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : null;

    if (code === "P2025") {
      return res.status(404).json({ error: "Budget item not found" });
    }

    return res.status(500).json({ error: "Failed to remove budget item" });
  }
});

export default router;
